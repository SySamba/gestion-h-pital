const pool = require('../config/database');
const { success, error } = require('../utils/response');
const { createNotification } = require('../utils/notifications');

const STAFF_ROLES = ['receptionniste', 'admin', 'medecin'];

const notifyStaff = async (title, message) => {
  const [staff] = await pool.execute(
    `SELECT id FROM users WHERE role IN (${STAFF_ROLES.map(() => '?').join(',')}) AND actif = TRUE`,
    STAFF_ROLES
  );
  await Promise.all(
    staff.map((u) => createNotification(u.id, title, message, 'systeme'))
  );
};

const create = async (req, res) => {
  try {
    const { message, localisation } = req.body;
    let patientId = null;
    let ticketId = null;

    const [pat] = await pool.execute('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
    if (pat[0]) {
      patientId = pat[0].id;
      const [activeTicket] = await pool.execute(
        "SELECT id FROM tickets WHERE patient_id = ? AND statut IN ('en_attente','en_cours') ORDER BY created_at DESC LIMIT 1",
        [patientId]
      );
      if (activeTicket[0]) ticketId = activeTicket[0].id;
    }

    const [result] = await pool.execute(
      'INSERT INTO alertes_urgence (user_id, patient_id, ticket_id, message, localisation) VALUES (?, ?, ?, ?, ?)',
      [
        req.user.id,
        patientId,
        ticketId,
        message || 'Demande d\'assistance urgente',
        localisation || 'Salle d\'attente',
      ]
    );

    const [user] = await pool.execute('SELECT prenom, nom FROM users WHERE id = ?', [req.user.id]);
    const nomPatient = user[0] ? `${user[0].prenom} ${user[0].nom}` : 'Patient';

    await notifyStaff(
      '🚨 Alerte urgence',
      `${nomPatient} demande une assistance urgente${localisation ? ` — ${localisation}` : ''}`
    );

    return success(res, { id: result.insertId }, 'Alerte urgence envoyée — le personnel a été notifié', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getAll = async (req, res) => {
  try {
    let query = `
      SELECT a.*, u.prenom, u.nom, u.telephone,
             tu.prenom as traite_prenom, tu.nom as traite_nom
      FROM alertes_urgence a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN users tu ON a.traite_par = tu.id
    `;
    const params = [];

    if (req.user.role === 'patient') {
      query += ' WHERE a.user_id = ?';
      params.push(req.user.id);
    } else if (STAFF_ROLES.includes(req.user.role)) {
      query += " WHERE a.statut IN ('active','prise_en_charge')";
    } else {
      return error(res, 'Accès refusé', 403);
    }

    query += ' ORDER BY a.created_at DESC LIMIT 50';
    const [rows] = await pool.execute(query, params);
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { statut } = req.body;
    if (!['prise_en_charge', 'resolue'].includes(statut)) {
      return error(res, 'statut invalide (prise_en_charge ou resolue)', 400);
    }

    await pool.execute(
      'UPDATE alertes_urgence SET statut = ?, traite_par = ?, traite_at = NOW() WHERE id = ?',
      [statut, req.user.id, req.params.id]
    );

    const [alert] = await pool.execute('SELECT user_id FROM alertes_urgence WHERE id = ?', [req.params.id]);
    if (alert[0]) {
      const msg = statut === 'resolue'
        ? 'Votre demande d\'assistance a été traitée'
        : 'Un membre du personnel prend en charge votre demande';
      await createNotification(alert[0].user_id, 'Assistance urgence', msg, 'systeme');
    }

    const [rows] = await pool.execute('SELECT * FROM alertes_urgence WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Alerte mise à jour');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { create, getAll, updateStatus };
