const pool = require('../config/database');

const { success, error } = require('../utils/response');

const { createNotification } = require('../utils/notifications');

const { enrichQueue, notifyPatientCalled } = require('./queueController');

const settingsService = require('../services/settingsService');
const billingService = require('../services/billingService');

const generateNumero = async () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const [count] = await pool.execute(
    'SELECT COUNT(*) as c FROM tickets WHERE DATE(created_at) = CURDATE()'
  );
  const num = String(count[0].c + 1).padStart(3, '0');
  return `T-${date}-${num}`;
};

const insertTicket = async (patient_id, { service, prix, priorite } = {}) => {
  const settings = await settingsService.getSettings();
  const duree = settings.ticket_duree_minutes || 120;
  const ticketPrix = prix ?? settings.ticket_prix ?? 5000;
  const numero = await generateNumero();
  const qrCode = `TKT-${patient_id}-${numero}`;

  const [result] = await pool.execute(
    `INSERT INTO tickets (patient_id, numero, qr_code, service, prix, priorite, duree_minutes, expire_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    [
      patient_id,
      numero,
      qrCode,
      service || 'Consultation générale',
      ticketPrix,
      priorite || 'normale',
      duree,
      duree,
    ]
  );

  await billingService.facturerTicket(result.insertId, patient_id, service || 'Consultation générale', ticketPrix);

  return { id: result.insertId, numero, qrCode, duree_minutes: duree, prix: ticketPrix };
};

const create = async (req, res) => {
  try {
    const { service, prix, priorite } = req.body;
    const [pat] = await pool.execute('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
    if (!pat.length) return error(res, 'Profil patient requis', 400);

    const ticket = await insertTicket(pat[0].id, { service, prix, priorite });

    await createNotification(
      req.user.id,
      'Ticket acheté',
      `Ticket ${ticket.numero} — valide ${ticket.duree_minutes} min`,
      'ticket'
    );

    return success(res, { ...ticket, paye: false }, 'Ticket créé — procédez au paiement', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const createForPatient = async (req, res) => {
  try {
    const { patient_id, service, prix, priorite } = req.body;
    const ticket = await insertTicket(patient_id, { service, prix, priorite });
    return success(res, ticket, 'Ticket généré', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};



const getAll = async (req, res) => {

  try {

    let query = `

      SELECT t.*, u.nom, u.prenom FROM tickets t

      JOIN patients p ON t.patient_id = p.id

      JOIN users u ON p.user_id = u.id

    `;

    const params = [];



    if (req.user.role === 'patient') {

      const [pat] = await pool.execute('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);

      query += ' WHERE t.patient_id = ?';

      params.push(pat[0]?.id);

    }



    query += ' ORDER BY t.created_at DESC';

    const [rows] = await pool.execute(query, params);

    return success(res, rows);

  } catch (e) {

    return error(res, e.message, 500);

  }

};



const getQueue = async (req, res) => {
  try {
    const avgWait = await prepareQueue();
    const [rows] = await pool.execute(`
      SELECT t.*, u.nom, u.prenom, u.telephone FROM tickets t
      JOIN patients p ON t.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE t.statut IN ('en_attente','en_cours')
    `);
    return success(res, enrichQueue(rows, avgWait));
  } catch (e) {
    return error(res, e.message, 500);
  }
};



const updateStatus = async (req, res) => {

  try {

    const { statut, priorite, salle, medecin_appel, statut_appel, afficher_nom_patient } = req.body;

    const updates = [];

    const params = [];



    if (statut) {

      updates.push('statut = ?');

      params.push(statut);

    }

    if (priorite) {

      updates.push('priorite = ?');

      params.push(priorite);

    }

    if (salle !== undefined) {

      updates.push('salle = ?');

      params.push(salle || null);

    }

    if (medecin_appel !== undefined) {

      updates.push('medecin_appel = ?');

      params.push(medecin_appel || null);

    }

    if (statut_appel) {

      updates.push('statut_appel = ?');

      params.push(statut_appel);

      if (statut_appel === 'appele') {

        updates.push('appele_at = NOW()');

      }

    }

    if (afficher_nom_patient !== undefined) {

      updates.push('afficher_nom_patient = ?');

      params.push(afficher_nom_patient ? 1 : 0);

    }

    if (!updates.length) return error(res, 'Aucune mise à jour fournie');



    if (statut === 'en_cours') {

      updates.push("statut_appel = 'en_consultation'");

    }



    params.push(req.params.id);

    await pool.execute(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`, params);



    const shouldNotify = statut === 'en_cours' || statut_appel === 'appele';

    if (shouldNotify) {

      await notifyPatientCalled(req.params.id);

    }



    const [rows] = await pool.execute('SELECT * FROM tickets WHERE id = ?', [req.params.id]);

    return success(res, rows[0], 'Statut mis à jour');

  } catch (e) {

    return error(res, e.message, 500);

  }

};



module.exports = { create, createForPatient, getAll, getQueue, updateStatus };

