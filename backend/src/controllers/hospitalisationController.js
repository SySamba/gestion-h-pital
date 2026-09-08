const pool = require('../config/database');
const { success, error } = require('../utils/response');
const { logAction } = require('../utils/audit');

// ─── LITS ───
const getLits = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT l.*, s.nom as salle_nom, s.type as salle_type
       FROM lits l
       JOIN salles s ON l.salle_id = s.id
       ORDER BY s.nom, l.numero`
    );
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const createLit = async (req, res) => {
  try {
    const { salle_id, numero, type, notes } = req.body;
    if (!salle_id || !numero) return error(res, 'salle_id et numero obligatoires', 400);

    const [salle] = await pool.execute('SELECT id FROM salles WHERE id = ?', [salle_id]);
    if (!salle.length) return error(res, 'Salle non trouvée', 404);

    const [result] = await pool.execute(
      'INSERT INTO lits (salle_id, numero, type, notes) VALUES (?, ?, ?, ?)',
      [salle_id, numero, type || 'standard', notes || null]
    );
    await logAction(req.user.id, 'CREATE_LIT', { id: result.insertId, salle_id, numero }, req.ip);
    return success(res, { id: result.insertId }, 'Lit créé', 201);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return error(res, 'Ce numéro de lit existe déjà dans cette salle', 409);
    return error(res, e.message, 500);
  }
};

const updateLit = async (req, res) => {
  try {
    const { statut, type, notes } = req.body;
    const fields = [];
    const values = [];
    if (statut) { fields.push('statut = ?'); values.push(statut); }
    if (type) { fields.push('type = ?'); values.push(type); }
    if (notes !== undefined) { fields.push('notes = ?'); values.push(notes); }
    if (!fields.length) return error(res, 'Aucun champ à mettre à jour', 400);

    values.push(req.params.id);
    await pool.execute(`UPDATE lits SET ${fields.join(', ')} WHERE id = ?`, values);
    return success(res, { id: req.params.id }, 'Lit mis à jour');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const deleteLit = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT statut FROM lits WHERE id = ?', [req.params.id]);
    if (!rows.length) return error(res, 'Lit non trouvé', 404);
    if (rows[0].statut === 'occupe') return error(res, 'Lit occupé — sortie patient requise', 400);

    await pool.execute('DELETE FROM lits WHERE id = ?', [req.params.id]);
    return success(res, { id: req.params.id }, 'Lit supprimé');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ─── HOSPITALISATIONS ───
const getHospitalisations = async (req, res) => {
  try {
    let query = `
      SELECT h.*, pu.nom as patient_nom, pu.prenom as patient_prenom,
             l.numero as lit_numero, s.nom as salle_nom,
             mu.nom as medecin_nom, mu.prenom as medecin_prenom
      FROM hospitalisations h
      JOIN patients p ON h.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN lits l ON h.lit_id = l.id
      JOIN salles s ON l.salle_id = s.id
      LEFT JOIN medecins m ON h.medecin_id = m.id
      LEFT JOIN users mu ON m.user_id = mu.id
    `;
    const params = [];
    if (req.user.role === 'patient') {
      const [pat] = await pool.execute('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
      if (!pat.length) return success(res, []);
      query += ' WHERE h.patient_id = ?';
      params.push(pat[0].id);
    }
    query += ' ORDER BY h.date_admission DESC';
    const [rows] = await pool.execute(query, params);
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getStats = async (_req, res) => {
  try {
    const [lits] = await pool.execute('SELECT statut, COUNT(*) as count FROM lits GROUP BY statut');
    const [hosp] = await pool.execute("SELECT COUNT(*) as en_cours FROM hospitalisations WHERE statut = 'en_cours'");
    const [today] = await pool.execute('SELECT COUNT(*) as admissions_today FROM hospitalisations WHERE DATE(date_admission) = CURDATE()');
    const [sorties] = await pool.execute('SELECT COUNT(*) as sorties_today FROM hospitalisations WHERE DATE(date_sortie) = CURDATE()');

    const litStats = {};
    lits.forEach((l) => { litStats[l.statut] = l.count; });

    return success(res, {
      ...litStats,
      total_lits: Object.values(litStats).reduce((a, b) => a + b, 0),
      en_cours: hosp[0].en_cours,
      admissions_today: today[0].admissions_today,
      sorties_today: sorties[0].sorties_today,
    });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const admettre = async (req, res) => {
  try {
    const { patient_id, lit_id, medecin_id, motif_admission, diagnostic_admission, notes_admission, cout_journalier } = req.body;
    if (!patient_id || !lit_id || !motif_admission) {
      return error(res, 'patient_id, lit_id et motif_admission obligatoires', 400);
    }

    const [lit] = await pool.execute('SELECT statut FROM lits WHERE id = ?', [lit_id]);
    if (!lit.length) return error(res, 'Lit non trouvé', 404);
    if (lit[0].statut === 'occupe') return error(res, 'Lit déjà occupé', 409);

    const [pat] = await pool.execute('SELECT id FROM patients WHERE id = ?', [patient_id]);
    if (!pat.length) return error(res, 'Patient non trouvé', 404);

    const [result] = await pool.execute(
      `INSERT INTO hospitalisations (patient_id, lit_id, medecin_id, motif_admission, diagnostic_admission, notes_admission, cout_journalier)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, lit_id, medecin_id || null, motif_admission, diagnostic_admission || null, notes_admission || null, cout_journalier || 10000]
    );

    await pool.execute("UPDATE lits SET statut = 'occupe' WHERE id = ?", [lit_id]);
    await logAction(req.user.id, 'ADMISSION_HOSPITALISATION', { id: result.insertId, patient_id, lit_id }, req.ip);

    return success(res, { id: result.insertId }, 'Patient admis', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const sortir = async (req, res) => {
  try {
    const { motif_sortie, notes_sortie } = req.body;
    const [hosp] = await pool.execute("SELECT * FROM hospitalisations WHERE id = ? AND statut = 'en_cours'", [req.params.id]);
    if (!hosp.length) return error(res, 'Hospitalisation non trouvée ou déjà clôturée', 404);

    await pool.execute(
      "UPDATE hospitalisations SET statut = 'sortie', date_sortie = NOW(), motif_sortie = ?, notes_sortie = ? WHERE id = ?",
      [motif_sortie || 'Guérison', notes_sortie || null, req.params.id]
    );
    await pool.execute("UPDATE lits SET statut = 'libre' WHERE id = ?", [hosp[0].lit_id]);
    await logAction(req.user.id, 'SORTIE_HOSPITALISATION', { id: req.params.id, lit_id: hosp[0].lit_id }, req.ip);

    return success(res, { id: req.params.id }, 'Sortie enregistrée');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = {
  getLits, createLit, updateLit, deleteLit,
  getHospitalisations, getStats, admettre, sortir,
};
