const pool = require('../config/database');
const { success, error } = require('../utils/response');
const { createNotification } = require('../utils/notifications');

const MODES_PAIEMENT = {
  especes: 'Espèces',
  wave: 'Wave',
  orange_money: 'Orange Money',
  free_money: 'Free Money',
  carte_bancaire: 'Carte bancaire',
};

const SEUIL_VALIDATION_ADMIN = 50000;

const generateFactureNum = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `FAC-${ymd}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
};

// ─── Dashboard ───
const getDashboard = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayTx] = await pool.execute(
      `SELECT COALESCE(SUM(CASE WHEN type_operation='encaissement' THEN montant ELSE 0 END),0) as total_encaisse,
              COALESCE(SUM(CASE WHEN type_operation='encaissement' AND mode_paiement='especes' THEN montant ELSE 0 END),0) as total_especes,
              COALESCE(SUM(CASE WHEN type_operation='encaissement' AND mode_paiement!='especes' THEN montant ELSE 0 END),0) as total_mobile,
              COUNT(*) as nb_transactions
       FROM transactions WHERE caissier_id=? AND statut='succes' AND date_transaction >= ?`,
      [req.user.id, todayStart]
    );

    const [recent] = await pool.execute(
      `SELECT * FROM transactions WHERE caissier_id=? AND statut='succes' ORDER BY date_transaction DESC LIMIT 10`,
      [req.user.id]
    );

    const [session] = await pool.execute(
      `SELECT * FROM caisse_sessions WHERE caissier_id=? AND statut='ouverte' ORDER BY date_ouverture DESC LIMIT 1`,
      [req.user.id]
    );

    const [facturesImpayees] = await pool.execute(
      `SELECT COUNT(*) as count FROM factures WHERE statut IN ('impayee','partielle')`
    );

    return success(res, {
      today: todayTx[0] || { total_encaisse: 0, total_especes: 0, total_mobile: 0, nb_transactions: 0 },
      recent,
      session: session[0] || null,
      factures_impayees: facturesImpayees[0]?.count || 0,
    });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ─── Caisse : ouvrir / clôturer ───
const openCaisse = async (req, res) => {
  try {
    const { fonds_initial = 0 } = req.body;
    const [existing] = await pool.execute(
      'SELECT id FROM caisse_sessions WHERE caissier_id=? AND statut="ouverte"',
      [req.user.id]
    );
    if (existing.length) return error(res, 'Une caisse est déjà ouverte', 400);

    const [result] = await pool.execute(
      'INSERT INTO caisse_sessions (caissier_id, fonds_initial, statut) VALUES (?, ?, "ouverte")',
      [req.user.id, fonds_initial]
    );
    const [rows] = await pool.execute('SELECT * FROM caisse_sessions WHERE id=?', [result.insertId]);
    return success(res, rows[0], 'Caisse ouverte', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const closeCaisse = async (req, res) => {
  try {
    const { solde_reel, notes } = req.body;
    const [sessions] = await pool.execute(
      'SELECT * FROM caisse_sessions WHERE caissier_id=? AND statut="ouverte" ORDER BY date_ouverture DESC LIMIT 1',
      [req.user.id]
    );
    if (!sessions.length) return error(res, 'Aucune caisse ouverte', 404);
    const session = sessions[0];

    const [totals] = await pool.execute(
      `SELECT COALESCE(SUM(CASE WHEN type_operation='encaissement' THEN montant ELSE -montant END),0) as solde_calcule
       FROM transactions WHERE caisse_session_id=? AND statut='succes'`,
      [session.id]
    );
    const solde_final = Number(session.fonds_initial) + Number(totals[0].solde_calcule || 0);
    const ecart = solde_reel != null ? Number(solde_reel) - solde_final : null;

    await pool.execute(
      'UPDATE caisse_sessions SET statut="cloturee", solde_final=?, solde_reel=?, ecart=?, notes=?, date_cloture=NOW() WHERE id=?',
      [solde_final, solde_reel || null, ecart, notes || null, session.id]
    );

    const [rows] = await pool.execute('SELECT * FROM caisse_sessions WHERE id=?', [session.id]);
    return success(res, rows[0], 'Caisse clôturée');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getCaisseStatus = async (req, res) => {
  try {
    const [session] = await pool.execute(
      'SELECT * FROM caisse_sessions WHERE caissier_id=? AND statut="ouverte" ORDER BY date_ouverture DESC LIMIT 1',
      [req.user.id]
    );

    if (!session.length) return success(res, { session: null, totals: null });

    const [totals] = await pool.execute(
      `SELECT 
        COALESCE(SUM(CASE WHEN type_operation='encaissement' THEN montant ELSE 0 END),0) as total_encaisse,
        COALESCE(SUM(CASE WHEN type_operation='remboursement' THEN montant ELSE 0 END),0) as total_rembourse,
        COALESCE(SUM(CASE WHEN mode_paiement='especes' AND type_operation='encaissement' THEN montant ELSE 0 END),0) as especes,
        COALESCE(SUM(CASE WHEN mode_paiement='wave' AND type_operation='encaissement' THEN montant ELSE 0 END),0) as wave,
        COALESCE(SUM(CASE WHEN mode_paiement='orange_money' AND type_operation='encaissement' THEN montant ELSE 0 END),0) as orange_money,
        COALESCE(SUM(CASE WHEN mode_paiement='free_money' AND type_operation='encaissement' THEN montant ELSE 0 END),0) as free_money,
        COALESCE(SUM(CASE WHEN mode_paiement='carte_bancaire' AND type_operation='encaissement' THEN montant ELSE 0 END),0) as carte_bancaire,
        COUNT(*) as nb_operations
       FROM transactions WHERE caisse_session_id=? AND statut='succes'`,
      [session[0].id]
    );

    const [ops] = await pool.execute(
      'SELECT * FROM transactions WHERE caisse_session_id=? ORDER BY date_transaction DESC',
      [session[0].id]
    );

    return success(res, { session: session[0], totals: totals[0], operations: ops });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ─── Encaissements ───
const encaisser = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { patient_id, patient_nom, libelle, type_service, montant, mode_paiement, facture_id } = req.body;

    if (!libelle || !montant || !mode_paiement) {
      conn.release();
      return error(res, 'libelle, montant et mode_paiement requis', 400);
    }
    if (!MODES_PAIEMENT[mode_paiement]) {
      conn.release();
      return error(res, 'Mode de paiement invalide', 400);
    }

    const [session] = await conn.execute(
      'SELECT id FROM caisse_sessions WHERE caissier_id=? AND statut="ouverte" LIMIT 1',
      [req.user.id]
    );
    if (!session.length) {
      conn.release();
      return error(res, 'Aucune caisse ouverte — ouvrez la caisse d\'abord', 400);
    }

    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO transactions (facture_id, caissier_id, caisse_session_id, patient_id, patient_nom, libelle, type_service, montant, mode_paiement, type_operation, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'encaissement', 'succes')`,
      [facture_id || null, req.user.id, session[0].id, patient_id || null, patient_nom || null, libelle, type_service || 'autre', montant, mode_paiement]
    );

    if (facture_id) {
      await conn.execute(
        'UPDATE factures SET montant_paye = montant_paye + ? WHERE id = ?',
        [montant, facture_id]
      );
      const [fac] = await conn.execute('SELECT montant_total, montant_paye, statut FROM factures WHERE id=?', [facture_id]);
      if (fac.length) {
        if (Number(fac[0].montant_paye) >= Number(fac[0].montant_total)) {
          await conn.execute("UPDATE factures SET statut='payee', date_paiement_complet=NOW() WHERE id=?", [facture_id]);
        } else if (Number(fac[0].montant_paye) > 0) {
          await conn.execute("UPDATE factures SET statut='partielle' WHERE id=?", [facture_id]);
        }
      }
    }

    await conn.commit();

    if (patient_id) {
      const [pu] = await conn.execute('SELECT user_id FROM patients WHERE id=?', [patient_id]);
      if (pu[0]) {
        await createNotification(pu[0].user_id, 'Paiement enregistré', `${Number(montant).toLocaleString('fr-FR')} FCFA — ${MODES_PAIEMENT[mode_paiement]}`, 'systeme');
      }
    }

    const [tx] = await conn.execute('SELECT * FROM transactions WHERE id=?', [result.insertId]);
    conn.release();
    return success(res, tx[0], 'Encaissement enregistré', 201);
  } catch (e) {
    await conn.rollback();
    conn.release();
    return error(res, e.message, 500);
  }
};

const getTransactions = async (req, res) => {
  try {
    const { patient, mode, statut, date, limit = 100 } = req.query;
    let query = `SELECT * FROM transactions WHERE 1=1`;
    const params = [];

    if (req.user.role === 'caissier') {
      query += ' AND caissier_id=?';
      params.push(req.user.id);
    }
    if (patient) { query += ' AND patient_nom LIKE ?'; params.push(`%${patient}%`); }
    if (mode) { query += ' AND mode_paiement=?'; params.push(mode); }
    if (statut) { query += ' AND statut=?'; params.push(statut); }
    if (date) { query += ' AND DATE(date_transaction)=?'; params.push(date); }

    query += ' ORDER BY date_transaction DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const [rows] = await pool.execute(query, params);
    return success(res, rows.map((r) => ({ ...r, mode_paiement_label: MODES_PAIEMENT[r.mode_paiement] || r.mode_paiement })));
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ─── Factures ───
const createFacture = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { patient_id, patient_nom, lignes, notes } = req.body;
    if (!lignes || !lignes.length) {
      conn.release();
      return error(res, 'Au moins une ligne de facture est requise', 400);
    }

    const numero = generateFactureNum();
    let montant_total = lignes.reduce((sum, l) => sum + Number(l.montant || 0), 0);

    let assurance_info = null;
    let montant_couvert = 0;
    let montant_patient = montant_total;

    if (patient_id) {
      const [assurances] = await conn.execute(
        `SELECT pa.*, a.nom as assurance_nom, a.taux_couverture as taux_defaut
         FROM patient_assurances pa
         JOIN assurances a ON pa.assurance_id = a.id
         WHERE pa.patient_id = ? AND pa.statut = 'actif'
         ORDER BY pa.created_at DESC LIMIT 1`,
        [patient_id]
      );
      if (assurances.length) {
        const taux = assurances[0].taux_couverture || assurances[0].taux_defaut || 0;
        montant_couvert = Math.round(montant_total * taux / 100);
        montant_patient = montant_total - montant_couvert;
        assurance_info = {
          assurance_id: assurances[0].assurance_id,
          assurance_nom: assurances[0].assurance_nom,
          numero_adherent: assurances[0].numero_adherent,
          taux_couverture: taux,
          montant_couvert,
          montant_patient,
        };
      }
    }

    await conn.beginTransaction();
    const [result] = await conn.execute(
      'INSERT INTO factures (numero, patient_id, patient_nom, caissier_id, montant_total, montant_paye, statut, notes) VALUES (?, ?, ?, ?, ?, 0, "impayee", ?)',
      [numero, patient_id || null, patient_nom || null, req.user.id, montant_patient, notes || null]
    );

    for (const l of lignes) {
      await conn.execute(
        'INSERT INTO facture_lignes (facture_id, libelle, type_service, montant, reference_id) VALUES (?, ?, ?, ?, ?)',
        [result.insertId, l.libelle, l.type_service || 'autre', l.montant, l.reference_id || null]
      );
    }

    await conn.commit();
    const [rows] = await conn.execute('SELECT * FROM factures WHERE id=?', [result.insertId]);
    const [lignesDb] = await conn.execute('SELECT * FROM facture_lignes WHERE facture_id=?', [result.insertId]);
    conn.release();
    return success(res, { ...rows[0], lignes: lignesDb, assurance: assurance_info }, 'Facture créée' + (assurance_info ? ` — Assurance: ${assurance_info.assurance_nom} (${assurance_info.taux_couverture}% couvert)` : ''), 201);
  } catch (e) {
    await conn.rollback();
    conn.release();
    return error(res, e.message, 500);
  }
};

const getFactures = async (req, res) => {
  try {
    const { numero, patient, statut, limit = 100 } = req.query;
    let query = `SELECT f.* FROM factures f WHERE 1=1`;
    const params = [];

    if (numero) { query += ' AND f.numero LIKE ?'; params.push(`%${numero}%`); }
    if (patient) { query += ' AND f.patient_nom LIKE ?'; params.push(`%${patient}%`); }
    if (statut) { query += ' AND f.statut=?'; params.push(statut); }

    query += ' ORDER BY f.date_creation DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    const [rows] = await pool.execute(query, params);
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getFacturesARecouvrer = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT f.*, 
              (SELECT GROUP_CONCAT(CONCAT(fl.libelle, ' (', FORMAT(fl.montant, 0), ' FCFA)') SEPARATOR ' | ') 
               FROM facture_lignes fl WHERE fl.facture_id = f.id) as lignes_resume
       FROM factures f 
       WHERE f.statut IN ('impayee','partielle') 
       ORDER BY f.date_creation DESC`
    );

    const totalARembourser = rows.reduce((sum, f) => sum + (Number(f.montant_total) - Number(f.montant_paye)), 0);

    return success(res, {
      factures: rows,
      count: rows.length,
      total_a_recouvrer: totalARembourser,
    });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getFacture = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM factures WHERE id=?', [req.params.id]);
    if (!rows.length) return error(res, 'Facture non trouvée', 404);
    const [lignes] = await pool.execute('SELECT * FROM facture_lignes WHERE facture_id=?', [req.params.id]);
    const [txs] = await pool.execute('SELECT * FROM transactions WHERE facture_id=? ORDER BY date_transaction DESC', [req.params.id]);
    return success(res, { ...rows[0], lignes, transactions: txs });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getFacturePdf = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM factures WHERE id=?', [req.params.id]);
    if (!rows.length) return error(res, 'Facture non trouvée', 404);
    const [lignes] = await pool.execute('SELECT * FROM facture_lignes WHERE facture_id=?', [req.params.id]);
    const f = rows[0];

    const { generateFacturePDF } = require('../utils/pdfGenerator');
    const doc = generateFacturePDF(f, lignes);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${f.numero}.pdf`);
    doc.pipe(res);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ─── Remboursements ───
const rembourser = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { transaction_id, motif, mode_paiement } = req.body;
    if (!transaction_id || !motif) {
      conn.release();
      return error(res, 'transaction_id et motif requis', 400);
    }

    const [txs] = await conn.execute('SELECT * FROM transactions WHERE id=?', [transaction_id]);
    if (!txs.length) {
      conn.release();
      return error(res, 'Transaction non trouvée', 404);
    }
    const tx = txs[0];
    if (tx.statut !== 'succes') {
      conn.release();
      return error(res, 'Cette transaction ne peut pas être remboursée', 400);
    }

    const needsAdmin = Number(tx.montant) >= SEUIL_VALIDATION_ADMIN;

    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO transactions (facture_id, caissier_id, caisse_session_id, patient_id, patient_nom, libelle, type_service, montant, mode_paiement, type_operation, statut, motif_annulation, valide_par_admin)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'remboursement', 'succes', ?, ?)`,
      [tx.facture_id, req.user.id, tx.caisse_session_id, tx.patient_id, tx.patient_nom, `Remboursement: ${tx.libelle}`, tx.type_service, tx.montant, mode_paiement || tx.mode_paiement, motif, !needsAdmin]
    );

    await conn.execute(
      'UPDATE transactions SET statut="annule", motif_annulation=? WHERE id=?',
      [motif, transaction_id]
    );

    if (tx.facture_id) {
      await conn.execute(
        'UPDATE factures SET montant_paye = GREATEST(montant_paye - ?, 0) WHERE id=?',
        [tx.montant, tx.facture_id]
      );
      const [fac] = await conn.execute('SELECT montant_paye FROM factures WHERE id=?', [tx.facture_id]);
      if (fac.length && Number(fac[0].montant_paye) === 0) {
        await conn.execute("UPDATE factures SET statut='impayee', date_paiement_complet=NULL WHERE id=?", [tx.facture_id]);
      } else if (fac.length) {
        await conn.execute("UPDATE factures SET statut='partielle', date_paiement_complet=NULL WHERE id=?", [tx.facture_id]);
      }
    }

    await conn.commit();
    conn.release();

    return success(res, {
      id: result.insertId,
      needs_admin_validation: needsAdmin,
      message: needsAdmin
        ? `Remboursement de ${Number(tx.montant).toLocaleString('fr-FR')} FCFA enregistré — validation administrateur requise`
        : 'Remboursement enregistré',
    }, 'Remboursement traité', 201);
  } catch (e) {
    await conn.rollback();
    conn.release();
    return error(res, e.message, 500);
  }
};

const validerRemboursement = async (req, res) => {
  try {
    const [txs] = await pool.execute('SELECT * FROM transactions WHERE id=? AND type_operation="remboursement" AND valide_par_admin=FALSE', [req.params.id]);
    if (!txs.length) return error(res, 'Remboursement non trouvé ou déjà validé', 404);

    await pool.execute('UPDATE transactions SET valide_par_admin=TRUE WHERE id=?', [req.params.id]);
    return success(res, { id: req.params.id }, 'Remboursement validé par l\'administrateur');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ─── Recherche ───
const search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return success(res, { patients: [], factures: [], transactions: [] });

    const [patients] = await pool.execute(
      `SELECT p.id, u.nom, u.prenom, u.email, u.telephone FROM patients p JOIN users u ON p.user_id=u.id
       WHERE u.nom LIKE ? OR u.prenom LIKE ? OR u.email LIKE ? OR p.qr_code LIKE ? LIMIT 10`,
      [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
    );

    const [factures] = await pool.execute(
      'SELECT * FROM factures WHERE numero LIKE ? OR patient_nom LIKE ? LIMIT 10',
      [`%${q}%`, `%${q}%`]
    );

    const [transactions] = await pool.execute(
      'SELECT * FROM transactions WHERE patient_nom LIKE ? OR libelle LIKE ? OR reference_transaction LIKE ? LIMIT 10',
      [`%${q}%`, `%${q}%`, `%${q}%`]
    );

    return success(res, { patients, factures, transactions });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = {
  getDashboard,
  openCaisse,
  closeCaisse,
  getCaisseStatus,
  encaisser,
  getTransactions,
  createFacture,
  getFactures,
  getFacturesARecouvrer,
  getFacture,
  getFacturePdf,
  rembourser,
  validerRemboursement,
  search,
  MODES_PAIEMENT,
};
