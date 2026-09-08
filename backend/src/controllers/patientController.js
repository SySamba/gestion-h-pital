const pool = require('../config/database');
const { success, error } = require('../utils/response');
const { createPatientAccount, DEFAULT_PASSWORD } = require('./receptionController');

const getAll = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.*, u.nom, u.prenom, u.email, u.telephone
      FROM patients p JOIN users u ON p.user_id = u.id
      ORDER BY u.nom
    `);
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getById = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.*, u.nom, u.prenom, u.email, u.telephone
      FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?
    `, [req.params.id]);
    if (!rows.length) return error(res, 'Patient non trouvé', 404);

    const patientId = req.params.id;
    const [historique] = await pool.execute(`
      SELECT h.*, m.specialite, u.nom as medecin_nom, u.prenom as medecin_prenom
      FROM historique_medical h
      LEFT JOIN medecins m ON h.medecin_id = m.id
      LEFT JOIN users u ON m.user_id = u.id
      WHERE h.patient_id = ? ORDER BY h.date_consultation DESC
    `, [patientId]);

    const [analyses] = await pool.execute(
      'SELECT * FROM analyses WHERE patient_id = ? ORDER BY date_demande DESC LIMIT 10',
      [patientId]
    );

    const [ordonnances] = await pool.execute(`
      SELECT o.*, mu.prenom as medecin_prenom, mu.nom as medecin_nom
      FROM ordonnances o
      JOIN medecins m ON o.medecin_id = m.id
      JOIN users mu ON m.user_id = mu.id
      WHERE o.patient_id = ? ORDER BY o.date_creation DESC LIMIT 10
    `, [patientId]);

    const [tickets] = await pool.execute(
      'SELECT * FROM tickets WHERE patient_id = ? ORDER BY created_at DESC LIMIT 5',
      [patientId]
    );

    const ordParsed = ordonnances.map((o) => ({
      ...o,
      medicaments: typeof o.medicaments === 'string' ? JSON.parse(o.medicaments) : o.medicaments,
    }));

    return success(res, { patient: rows[0], historique, analyses, ordonnances: ordParsed, tickets });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getMyProfile = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.*, u.nom, u.prenom, u.email, u.telephone
      FROM patients p JOIN users u ON p.user_id = u.id WHERE p.user_id = ?
    `, [req.user.id]);
    if (!rows.length) return error(res, 'Profil patient non trouvé', 404);

    const patient = rows[0];

    const [historique] = await pool.execute(
      'SELECT * FROM historique_medical WHERE patient_id = ? ORDER BY date_consultation DESC',
      [patient.id]
    );

    const [analyses] = await pool.execute(
      'SELECT * FROM analyses WHERE patient_id = ? ORDER BY date_demande DESC LIMIT 10',
      [patient.id]
    );

    const [ordonnances] = await pool.execute(`
      SELECT o.*, mu.prenom as medecin_prenom, mu.nom as medecin_nom
      FROM ordonnances o
      JOIN medecins m ON o.medecin_id = m.id
      JOIN users mu ON m.user_id = mu.id
      WHERE o.patient_id = ? ORDER BY o.date_creation DESC LIMIT 10
    `, [patient.id]);

    const [tickets] = await pool.execute(
      'SELECT * FROM tickets WHERE patient_id = ? ORDER BY created_at DESC LIMIT 5',
      [patient.id]
    );

    const ordParsed = ordonnances.map((o) => ({
      ...o,
      medicaments: typeof o.medicaments === 'string' ? JSON.parse(o.medicaments) : o.medicaments,
    }));

    return success(res, { patient, historique, analyses, ordonnances: ordParsed, tickets });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const update = async (req, res) => {
  try {
    const { date_naissance, sexe, adresse, groupe_sanguin, allergies } = req.body;
    const id = req.params.id;

    await pool.execute(
      `UPDATE patients SET date_naissance=COALESCE(?,date_naissance), sexe=COALESCE(?,sexe),
       adresse=COALESCE(?,adresse), groupe_sanguin=COALESCE(?,groupe_sanguin), allergies=COALESCE(?,allergies)
       WHERE id = ?`,
      [date_naissance, sexe, adresse, groupe_sanguin, allergies, id]
    );
    const [rows] = await pool.execute('SELECT * FROM patients WHERE id = ?', [id]);
    return success(res, rows[0], 'Profil mis à jour');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const addHistorique = async (req, res) => {
  try {
    const { patient_id, diagnostic, notes } = req.body;
    const [med] = await pool.execute('SELECT id FROM medecins WHERE user_id = ?', [req.user.id]);
    const medecinId = med[0]?.id || null;

    const [result] = await pool.execute(
      'INSERT INTO historique_medical (patient_id, medecin_id, diagnostic, notes) VALUES (?, ?, ?, ?)',
      [patient_id, medecinId, diagnostic, notes || null]
    );
    return success(res, { id: result.insertId }, 'Historique ajouté', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const registerPatient = async (req, res) => {
  try {
    const { email, password, nom, prenom, telephone, date_naissance, sexe, allergies, adresse } = req.body;
    if (!nom?.trim() || !prenom?.trim()) {
      return error(res, 'Nom et prénom requis');
    }

    const created = await createPatientAccount({
      email: email?.trim() || undefined,
      password: password || DEFAULT_PASSWORD,
      nom: nom.trim(),
      prenom: prenom.trim(),
      telephone,
      date_naissance,
      sexe,
      allergies,
      adresse,
    });

    return success(res, {
      userId: created.userId,
      patient_id: created.patient_id,
      qrCode: created.qrCode,
      credentials: created.credentials,
    }, 'Patient enregistré — compte de connexion actif', 201);
  } catch (e) {
    if (e.code === 'DUPLICATE') return error(res, e.message, 409);
    return error(res, e.message, 500);
  }
};

const updateMyProfile = async (req, res) => {
  try {
    const { date_naissance, sexe, adresse, groupe_sanguin, allergies, telephone } = req.body;
    const [pat] = await pool.execute('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
    if (!pat.length) return error(res, 'Profil patient non trouvé', 404);

    await pool.execute(
      `UPDATE patients SET date_naissance=COALESCE(?,date_naissance), sexe=COALESCE(?,sexe),
       adresse=COALESCE(?,adresse), groupe_sanguin=COALESCE(?,groupe_sanguin), allergies=COALESCE(?,allergies)
       WHERE id = ?`,
      [date_naissance, sexe, adresse, groupe_sanguin, allergies, pat[0].id]
    );

    if (telephone) {
      await pool.execute('UPDATE users SET telephone = ? WHERE id = ?', [telephone, req.user.id]);
    }

    const [rows] = await pool.execute(`
      SELECT p.*, u.nom, u.prenom, u.email, u.telephone
      FROM patients p JOIN users u ON p.user_id = u.id WHERE p.user_id = ?
    `, [req.user.id]);
    return success(res, rows[0], 'Profil mis à jour');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { getAll, getById, getMyProfile, updateMyProfile, update, addHistorique, registerPatient };
