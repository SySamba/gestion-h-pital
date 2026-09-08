const pool = require('../config/database');
const { success, error } = require('../utils/response');
const { createNotification } = require('../utils/notifications');

const OPERATEURS = {
  wave: { label: 'Wave', prefix: 'WVE' },
  orange_money: { label: 'Orange Money', prefix: 'ORM' },
  free_money: { label: 'Free Money', prefix: 'FRM' },
};

const generateRef = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

/** Simule un paiement Mobile Money — succès après validation */
const simuler = async (req, res) => {
  try {
    const { reference_type, reference_id, montant, operateur, telephone } = req.body;

    if (!reference_type || !reference_id || !montant || !operateur) {
      return error(res, 'reference_type, reference_id, montant et operateur requis');
    }
    if (!OPERATEURS[operateur]) {
      return error(res, 'Opérateur invalide (wave, orange_money, free_money)');
    }

    const table = reference_type === 'ticket' ? 'tickets' : 'rendez_vous';
    const [ref] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [reference_id]);
    if (!ref.length) return error(res, 'Référence introuvable', 404);

    const [pending] = await pool.execute(
      `INSERT INTO paiements (user_id, reference_type, reference_id, montant, operateur, telephone, statut, mode_simulation)
       VALUES (?, ?, ?, ?, ?, ?, 'en_attente', TRUE)`,
      [req.user.id, reference_type, reference_id, montant, operateur, telephone || null]
    );

    return success(res, {
      id: pending.insertId,
      statut: 'en_attente',
      operateur: OPERATEURS[operateur].label,
      montant,
      message: `Demande envoyée à ${OPERATEURS[operateur].label}. Confirmez sur votre téléphone ${telephone || ''}.`,
      simulation: true,
    }, 'Paiement en attente de confirmation', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

/** Confirme un paiement simulé (comme si le patient avait validé sur son téléphone) */
const confirmer = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut = 'succes' } = req.body;

    const [rows] = await pool.execute('SELECT * FROM paiements WHERE id = ?', [id]);
    if (!rows.length) return error(res, 'Paiement introuvable', 404);
    const paiement = rows[0];

    if (paiement.statut !== 'en_attente') {
      return error(res, 'Paiement déjà traité');
    }

    const op = OPERATEURS[paiement.operateur];
    const refTx = statut === 'succes' ? generateRef(op.prefix) : null;

    await pool.execute(
      'UPDATE paiements SET statut = ?, reference_transaction = ? WHERE id = ?',
      [statut, refTx, id]
    );

    if (statut === 'succes') {
      const table = paiement.reference_type === 'ticket' ? 'tickets' : 'rendez_vous';
      await pool.execute(`UPDATE ${table} SET paye = TRUE, paiement_id = ? WHERE id = ?`, [id, paiement.reference_id]);

      await createNotification(
        paiement.user_id,
        'Paiement confirmé',
        `[SIMULATION] ${Number(paiement.montant).toLocaleString('fr-FR')} FCFA via ${op.label}. Réf: ${refTx}`,
        'systeme'
      );
    }

    return success(res, {
      id: paiement.id,
      statut,
      reference_transaction: refTx,
      recu: statut === 'succes' ? {
        montant: paiement.montant,
        operateur: op.label,
        reference: refTx,
        date: new Date().toISOString(),
        simulation: true,
      } : null,
    }, statut === 'succes' ? 'Paiement réussi (simulation)' : 'Paiement échoué');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getHistorique = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM paiements WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    return success(res, rows.map((r) => ({
      ...r,
      operateur_label: OPERATEURS[r.operateur]?.label || r.operateur,
    })));
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { simuler, confirmer, getHistorique, OPERATEURS };
