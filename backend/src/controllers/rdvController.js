const pool = require('../config/database');
const { success, error } = require('../utils/response');
const { createNotification } = require('../utils/notifications');
const { sendRdvReminder } = require('../utils/smsSimulator');

const create = async (req, res) => {
  try {
    const { medecin_id, date_heure, motif } = req.body;
    let patientId = req.body.patient_id;

    if (req.user.role === 'patient') {
      const [pat] = await pool.execute('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
      patientId = pat[0]?.id;
    }
    if (!patientId || !medecin_id || !date_heure) {
      return error(res, 'patient_id, medecin_id et date_heure requis');
    }

    const [result] = await pool.execute(
      'INSERT INTO rendez_vous (patient_id, medecin_id, date_heure, motif) VALUES (?, ?, ?, ?)',
      [patientId, medecin_id, date_heure, motif || null]
    );

    const [patUser] = await pool.execute(`
      SELECT p.user_id, pu.telephone, pu.prenom, r.date_heure, r.motif
      FROM rendez_vous r
      JOIN patients p ON r.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      WHERE r.id = ?
    `, [result.insertId]);

    if (patUser[0]) {
      await createNotification(
        patUser[0].user_id,
        'Rendez-vous confirmé',
        `RDV planifié le ${new Date(date_heure).toLocaleString('fr-FR')}`,
        'rdv'
      );
      try {
        await sendRdvReminder(
          { date_heure, motif: motif || null },
          { user_id: patUser[0].user_id, telephone: patUser[0].telephone, prenom: patUser[0].prenom }
        );
        await pool.execute('UPDATE rendez_vous SET sms_rappel_envoye = TRUE WHERE id = ?', [result.insertId]);
      } catch (_) { /* SMS simulation optionnelle */ }
    }
    return success(res, { id: result.insertId, paye: false, sms_envoye: true }, 'Rendez-vous créé', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getAll = async (req, res) => {
  try {
    let query = `
      SELECT r.*, pu.nom as patient_nom, pu.prenom as patient_prenom,
             mu.nom as medecin_nom, mu.prenom as medecin_prenom, m.specialite
      FROM rendez_vous r
      JOIN patients p ON r.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN medecins m ON r.medecin_id = m.id
      JOIN users mu ON m.user_id = mu.id
    `;
    const params = [];

    if (req.user.role === 'patient') {
      const [pat] = await pool.execute('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
      query += ' WHERE r.patient_id = ?';
      params.push(pat[0]?.id);
    } else if (req.user.role === 'medecin') {
      const [med] = await pool.execute('SELECT id FROM medecins WHERE user_id = ?', [req.user.id]);
      query += ' WHERE r.medecin_id = ?';
      params.push(med[0]?.id);
    }

    query += ' ORDER BY r.date_heure ASC';
    const [rows] = await pool.execute(query, params);
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getToday = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT r.*, pu.nom as patient_nom, pu.prenom as patient_prenom,
             mu.nom as medecin_nom, mu.prenom as medecin_prenom
      FROM rendez_vous r
      JOIN patients p ON r.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN medecins m ON r.medecin_id = m.id
      JOIN users mu ON m.user_id = mu.id
      WHERE DATE(r.date_heure) = CURDATE()
      ORDER BY r.date_heure ASC
    `);
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { statut, notes } = req.body;
    await pool.execute(
      'UPDATE rendez_vous SET statut = COALESCE(?, statut), notes = COALESCE(?, notes) WHERE id = ?',
      [statut, notes, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM rendez_vous WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Rendez-vous mis à jour');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getDisponibilites = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM disponibilites_medecins WHERE medecin_id = ? ORDER BY jour_semaine, heure_debut',
      [req.params.medecinId]
    );
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getMedecins = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT m.*, u.nom, u.prenom, u.email, u.telephone
      FROM medecins m JOIN users u ON m.user_id = u.id
    `);
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { create, getAll, getToday, updateStatus, getDisponibilites, getMedecins };
