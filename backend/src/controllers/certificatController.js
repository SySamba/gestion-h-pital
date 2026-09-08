const pool = require('../config/database');
const { success, error } = require('../utils/response');
const { logAction } = require('../utils/audit');

const TYPE_LABELS = {
  arret_travail: "Arrêt de travail",
  aptitude: "Certificat d'aptitude",
  consultation: "Certificat de consultation",
  hospitalisation: "Certificat d'hospitalisation",
  deces: "Certificat de décès",
  autre: "Autre certificat",
};

const generateNumero = () => {
  const d = new Date();
  const y = d.getFullYear();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `CERT-${y}-${rand}`;
};

const create = async (req, res) => {
  try {
    const { patient_id, type, date_examen, date_debut, date_fin, nombre_jours, contenu, conclusion, lieu } = req.body;
    if (!patient_id || !type || !date_examen || !contenu) {
      return error(res, 'patient_id, type, date_examen et contenu sont obligatoires', 400);
    }

    const [med] = await pool.execute('SELECT id FROM medecins WHERE user_id = ?', [req.user.id]);
    if (!med.length && req.user.role !== 'admin') {
      return error(res, 'Profil médecin requis', 400);
    }
    let medecin_id = med[0]?.id || null;
    if (!medecin_id) {
      const [adminMed] = await pool.execute('SELECT id FROM medecins ORDER BY id LIMIT 1');
      if (!adminMed.length) return error(res, 'Aucun médecin enregistré', 400);
      medecin_id = adminMed[0].id;
    }

    const [pat] = await pool.execute('SELECT id FROM patients WHERE id = ?', [patient_id]);
    if (!pat.length) return error(res, 'Patient non trouvé', 404);

    const numero = generateNumero();
    const [result] = await pool.execute(
      `INSERT INTO certificats (patient_id, medecin_id, type, numero, date_examen, date_debut, date_fin, nombre_jours, contenu, conclusion, lieu)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [patient_id, medecin_id, type, numero, date_examen, date_debut || null, date_fin || null, nombre_jours || null, contenu, conclusion || null, lieu || null]
    );

    await logAction(req.user.id, 'CREATE_CERTIFICAT', { id: result.insertId, type, patient_id }, req.ip);
    return success(res, { id: result.insertId, numero }, 'Certificat créé', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getAll = async (req, res) => {
  try {
    let query = `
      SELECT c.*, pu.nom as patient_nom, pu.prenom as patient_prenom,
             mu.nom as medecin_nom, mu.prenom as medecin_prenom, m.specialite
      FROM certificats c
      JOIN patients p ON c.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      LEFT JOIN medecins m ON c.medecin_id = m.id
      LEFT JOIN users mu ON m.user_id = mu.id
    `;
    const params = [];

    if (req.user.role === 'patient') {
      const [pat] = await pool.execute('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
      if (!pat.length) return success(res, []);
      query += ' WHERE c.patient_id = ?';
      params.push(pat[0].id);
    }

    query += ' ORDER BY c.date_emission DESC';
    const [rows] = await pool.execute(query, params);
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getById = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*, pu.nom as patient_nom, pu.prenom as patient_prenom, p.date_naissance, p.sexe,
              mu.nom as medecin_nom, mu.prenom as medecin_prenom, m.specialite
       FROM certificats c
       JOIN patients p ON c.patient_id = p.id
       JOIN users pu ON p.user_id = pu.id
       LEFT JOIN medecins m ON c.medecin_id = m.id
       LEFT JOIN users mu ON m.user_id = mu.id
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return error(res, 'Certificat non trouvé', 404);

    if (req.user.role === 'patient') {
      const [pat] = await pool.execute('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
      if (!pat.length || pat[0].id !== rows[0].patient_id) {
        return error(res, 'Accès non autorisé à ce certificat', 403);
      }
    }

    return success(res, rows[0]);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getTypes = (_req, res) => {
  return success(res, Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })));
};

const remove = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM certificats WHERE id = ?', [req.params.id]);
    if (!rows.length) return error(res, 'Certificat non trouvé', 404);

    await pool.execute('DELETE FROM certificats WHERE id = ?', [req.params.id]);
    await logAction(req.user.id, 'DELETE_CERTIFICAT', { id: req.params.id, numero: rows[0].numero, patient_id: rows[0].patient_id }, req.ip);
    return success(res, null, 'Certificat supprimé');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { create, getAll, getById, getTypes, remove, TYPE_LABELS };
