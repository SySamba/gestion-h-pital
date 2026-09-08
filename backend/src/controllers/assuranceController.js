const pool = require('../config/database');
const { success, error } = require('../utils/response');
const { logAction } = require('../utils/audit');

const TYPE_LABELS = {
  assurance_sante: 'Assurance santé',
  mutuelle: 'Mutuelle',
  ipm: 'IPM (Institution de Prévoyance Maladie)',
  cnss: 'CNSS',
  autre: 'Autre',
};

// ─── ASSURANCES (CRUD) ───
const getAll = async (_req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM assurances ORDER BY nom');
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const create = async (req, res) => {
  try {
    const { nom, type, telephone, email, adresse, taux_couverture, plafond_annuel } = req.body;
    if (!nom) return error(res, 'Nom obligatoire', 400);

    const [result] = await pool.execute(
      'INSERT INTO assurances (nom, type, telephone, email, adresse, taux_couverture, plafond_annuel) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nom, type || 'assurance_sante', telephone || null, email || null, adresse || null, taux_couverture || 80, plafond_annuel || null]
    );
    await logAction(req.user.id, 'CREATE_ASSURANCE', { id: result.insertId, nom }, req.ip);
    return success(res, { id: result.insertId }, 'Assurance créée', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const update = async (req, res) => {
  try {
    const { nom, type, telephone, email, adresse, taux_couverture, plafond_annuel, actif } = req.body;
    const fields = [];
    const values = [];
    if (nom) { fields.push('nom = ?'); values.push(nom); }
    if (type) { fields.push('type = ?'); values.push(type); }
    if (telephone !== undefined) { fields.push('telephone = ?'); values.push(telephone); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (adresse !== undefined) { fields.push('adresse = ?'); values.push(adresse); }
    if (taux_couverture !== undefined) { fields.push('taux_couverture = ?'); values.push(taux_couverture); }
    if (plafond_annuel !== undefined) { fields.push('plafond_annuel = ?'); values.push(plafond_annuel); }
    if (actif !== undefined) { fields.push('actif = ?'); values.push(actif); }
    if (!fields.length) return error(res, 'Aucun champ à mettre à jour', 400);

    values.push(req.params.id);
    await pool.execute(`UPDATE assurances SET ${fields.join(', ')} WHERE id = ?`, values);
    return success(res, { id: req.params.id }, 'Assurance mise à jour');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const remove = async (req, res) => {
  try {
    await pool.execute('DELETE FROM assurances WHERE id = ?', [req.params.id]);
    return success(res, { id: req.params.id }, 'Assurance supprimée');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// ─── PATIENT-ASSURANCES (rattachements) ───
const getPatientAssurances = async (req, res) => {
  try {
    let query = `
      SELECT pa.*, a.nom as assurance_nom, a.type as assurance_type, a.taux_couverture as assurance_taux,
             pu.nom as patient_nom, pu.prenom as patient_prenom
      FROM patient_assurances pa
      JOIN assurances a ON pa.assurance_id = a.id
      JOIN patients p ON pa.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
    `;
    const params = [];
    if (req.user.role === 'patient') {
      const [pat] = await pool.execute('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
      if (!pat.length) return success(res, []);
      query += ' WHERE pa.patient_id = ?';
      params.push(pat[0].id);
    }
    query += ' ORDER BY pa.created_at DESC';
    const [rows] = await pool.execute(query, params);
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const attachPatient = async (req, res) => {
  try {
    const { patient_id, assurance_id, numero_adherent, taux_couverture, date_debut, date_fin } = req.body;
    if (!patient_id || !assurance_id || !numero_adherent) {
      return error(res, 'patient_id, assurance_id et numero_adherent obligatoires', 400);
    }

    const [existing] = await pool.execute(
      "SELECT id FROM patient_assurances WHERE patient_id = ? AND assurance_id = ? AND statut = 'actif'",
      [patient_id, assurance_id]
    );
    if (existing.length) return error(res, 'Patient déjà rattaché à cette assurance (actif)', 409);

    const [result] = await pool.execute(
      'INSERT INTO patient_assurances (patient_id, assurance_id, numero_adherent, taux_couverture, date_debut, date_fin) VALUES (?, ?, ?, ?, ?, ?)',
      [patient_id, assurance_id, numero_adherent, taux_couverture || null, date_debut || null, date_fin || null]
    );
    await logAction(req.user.id, 'ATTACH_ASSURANCE', { id: result.insertId, patient_id, assurance_id }, req.ip);
    return success(res, { id: result.insertId }, 'Assurance rattachée au patient', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const detachPatient = async (req, res) => {
  try {
    await pool.execute('DELETE FROM patient_assurances WHERE id = ?', [req.params.id]);
    return success(res, { id: req.params.id }, 'Rattachement supprimé');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getTypes = (_req, res) => {
  return success(res, Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })));
};

module.exports = {
  getAll, create, update, remove,
  getPatientAssurances, attachPatient, detachPatient, getTypes, TYPE_LABELS,
};
