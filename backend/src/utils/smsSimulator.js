const pool = require('../config/database');
const { createNotification } = require('./notifications');

/** Simulation SMS — en production, remplacer par API Orange/Sonatel */
const sendSms = async ({ userId, telephone, message, type = 'custom' }) => {
  const tel = telephone || '0000000000';
  const [result] = await pool.execute(
    'INSERT INTO sms_simulations (user_id, telephone, message, type, statut) VALUES (?, ?, ?, ?, ?)',
    [userId || null, tel, message, type, 'envoye']
  );

  if (userId) {
    await createNotification(
      userId,
      'SMS simulé envoyé',
      `[SIMULATION] ${message.slice(0, 120)}${message.length > 120 ? '…' : ''}`,
      'systeme'
    );
  }

  return {
    id: result.insertId,
    telephone: tel,
    message,
    statut: 'envoye',
    simulation: true,
    provider: 'Orange SMS API (simulation)',
  };
};

const sendRdvReminder = async (rdv, patientUser) => {
  const dateStr = new Date(rdv.date_heure).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });
  const msg = `MedikaSN: Rappel RDV le ${dateStr}. Motif: ${rdv.motif || 'Consultation'}. Répondez STOP pour désabonner.`;
  return sendSms({
    userId: patientUser.user_id,
    telephone: patientUser.telephone,
    message: msg,
    type: 'rdv_rappel',
  });
};

const sendQueueNotification = async (userId, telephone, numero, message) => {
  const msg = message || `MedikaSN: C'est votre tour ! Ticket ${numero}. Présentez-vous au cabinet.`;
  return sendSms({ userId, telephone, message: msg, type: 'file_attente' });
};

module.exports = { sendSms, sendRdvReminder, sendQueueNotification };
