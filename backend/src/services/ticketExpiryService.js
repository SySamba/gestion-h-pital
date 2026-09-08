const pool = require('../config/database');
const { createNotification } = require('../utils/notifications');

const expireOverdueTickets = async () => {
  const [expired] = await pool.execute(`
    SELECT t.id, t.numero, p.user_id
    FROM tickets t
    JOIN patients p ON t.patient_id = p.id
    WHERE t.statut = 'en_attente'
      AND t.expire_at IS NOT NULL
      AND t.expire_at < NOW()
  `);

  if (!expired.length) return 0;

  const ids = expired.map((t) => t.id);
  await pool.execute(
    `UPDATE tickets SET statut = 'annule', statut_appel = 'en_attente' WHERE id IN (${ids.map(() => '?').join(',')})`,
    ids
  );

  await Promise.all(
    expired.map((t) =>
      createNotification(
        t.user_id,
        'Ticket expiré',
        `Votre ticket ${t.numero} a expiré. Veuillez en acheter un nouveau à l'accueil.`,
        'ticket'
      )
    )
  );

  return expired.length;
};

module.exports = { expireOverdueTickets };
