const pool = require('../config/database');
const { success, error } = require('../utils/response');
const { createNotification } = require('../utils/notifications');
const { sendQueueNotification } = require('../utils/smsSimulator');
const settingsService = require('../services/settingsService');
const { expireOverdueTickets } = require('../services/ticketExpiryService');

const PRIORITY_ORDER = { tres_urgente: 0, urgente: 1, normale: 2 };

const sortQueue = (rows) =>
  [...rows].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priorite || 'normale'] ?? 2;
    const pb = PRIORITY_ORDER[b.priorite || 'normale'] ?? 2;
    if (pa !== pb) return pa - pb;
    return new Date(a.created_at) - new Date(b.created_at);
  });

const enrichQueue = (rows, avgWait = 8) => {
  const sorted = sortQueue(rows);
  const enCours = sorted.find((t) => t.statut === 'en_cours');
  const waiting = sorted.filter((t) => t.statut === 'en_attente');

  return sorted.map((t) => {
    const position = t.statut === 'en_cours' ? 0 : waiting.findIndex((w) => w.id === t.id) + 1;
    const waitMinutes = t.statut === 'en_cours' ? 0 : position * avgWait;
    const expireSoon = t.expire_at && t.statut === 'en_attente'
      ? Math.max(0, Math.round((new Date(t.expire_at) - Date.now()) / 60000))
      : null;
    return {
      ...t,
      position,
      temps_estime_min: waitMinutes,
      minutes_avant_expiration: expireSoon,
      ticket_en_cours: enCours?.numero || null,
    };
  });
};

const prepareQueue = async () => {
  await expireOverdueTickets();
  const settings = await settingsService.getSettings();
  return settings.temps_attente_moyen_min || 8;
};

const getLive = async (req, res) => {
  try {
    const avgWait = await prepareQueue();
    const [rows] = await pool.execute(`
      SELECT t.*, u.nom, u.prenom, u.telephone, p.user_id as patient_user_id
      FROM tickets t
      JOIN patients p ON t.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE t.statut IN ('en_attente','en_cours')
    `);
    const queue = enrichQueue(rows, avgWait);
    const enCours = queue.find((t) => t.statut === 'en_cours');
    const prochain = queue.find((t) => t.statut === 'en_attente');

    return success(res, {
      ticket_en_cours: enCours || null,
      prochain: prochain || null,
      file: queue,
      total_en_attente: queue.filter((t) => t.statut === 'en_attente').length,
      temps_moyen_min: avgWait,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getMyPosition = async (req, res) => {
  try {
    const avgWait = await prepareQueue();
    const [pat] = await pool.execute('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
    if (!pat.length) return error(res, 'Profil patient requis', 400);

    const [rows] = await pool.execute(`
      SELECT t.*, u.nom, u.prenom FROM tickets t
      JOIN patients p ON t.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE t.statut IN ('en_attente','en_cours')
    `);
    const queue = enrichQueue(rows, avgWait);
    const mine = queue.filter((t) => t.patient_id === pat[0].id);
    const active = mine.find((t) => t.statut === 'en_cours') || mine.find((t) => t.statut === 'en_attente');

    return success(res, {
      ticket: active || null,
      position: active?.position ?? null,
      temps_estime_min: active?.temps_estime_min ?? null,
      minutes_avant_expiration: active?.minutes_avant_expiration ?? null,
      ticket_en_cours: queue.find((t) => t.statut === 'en_cours')?.numero || null,
      file: queue,
    });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const mapDisplayTicket = (t) => ({
  numero: t.numero,
  priorite: t.priorite,
  service: t.service,
  salle: t.salle,
  medecin: t.medecin_appel,
  statut_appel: t.statut === 'en_cours' ? 'en_consultation' : (t.statut_appel || 'en_attente'),
  appele_at: t.appele_at,
  patient: t.prenom,
  patient_nom_complet: `${t.prenom} ${t.nom || ''}`.trim(),
});

const getDisplay = async (req, res) => {
  try {
    const avgWait = await prepareQueue();
    const [rows] = await pool.execute(`
      SELECT t.numero, t.statut, t.priorite, t.service, t.salle, t.medecin_appel,
             t.statut_appel, t.afficher_nom_patient, t.appele_at, u.prenom, u.nom
      FROM tickets t
      JOIN patients p ON t.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE t.statut IN ('en_attente','en_cours')
    `);
    const queue = enrichQueue(rows, avgWait);
    const enCours = queue.find((t) => t.statut === 'en_cours');
    const appele = queue.find((t) => t.statut_appel === 'appele' && t.statut === 'en_attente');

    return success(res, {
      en_cours: enCours ? mapDisplayTicket(enCours) : null,
      appele: appele ? mapDisplayTicket(appele) : null,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const notifyPatientCalled = async (ticketId) => {
  const [rows] = await pool.execute(`
    SELECT t.numero, u.id as user_id, u.telephone, u.prenom
    FROM tickets t
    JOIN patients p ON t.patient_id = p.id
    JOIN users u ON p.user_id = u.id
    WHERE t.id = ?
  `, [ticketId]);
  if (!rows[0]) return;

  const { numero, user_id, telephone, prenom } = rows[0];
  const [ticketInfo] = await pool.execute(
    'SELECT salle, medecin_appel FROM tickets WHERE id = ?',
    [ticketId]
  );
  const salle = ticketInfo[0]?.salle;
  const medecin = ticketInfo[0]?.medecin_appel;
  const destination = [salle, medecin].filter(Boolean).join(' — ') || 'au cabinet médical';

  await createNotification(
    user_id,
    'C\'est votre tour !',
    `Ticket ${numero} — présentez-vous ${destination.startsWith('au') ? destination : `à ${destination}`}`,
    'ticket'
  );
  if (telephone) {
    await sendQueueNotification(
      user_id,
      telephone,
      numero,
      `MedikaSN: Bonjour ${prenom}, c'est votre tour ! Ticket ${numero}. Rendez-vous ${destination}.`
    );
  }
};

// ─── Appel du patient suivant (médecin) ───
// Termine le ticket en cours (optionnellement lié à un patient_id) puis
// passe le prochain ticket en_attente à 'en_cours' + notification.
const callNext = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { patient_id, ticket_id, salle, medecin_appel } = req.body;

    await conn.beginTransaction();

    // 1. Terminer le ticket en cours (par ticket_id ou patient_id)
    let ended = null;
    if (ticket_id) {
      const [r] = await conn.execute(
        "UPDATE tickets SET statut = 'termine', statut_appel = 'en_attente' WHERE id = ? AND statut = 'en_cours'",
        [ticket_id]
      );
      ended = r.affectedRows ? ticket_id : null;
    } else if (patient_id) {
      const [r] = await conn.execute(
        "UPDATE tickets SET statut = 'termine', statut_appel = 'en_attente' WHERE patient_id = ? AND statut = 'en_cours'",
        [patient_id]
      );
      ended = r.affectedRows ? patient_id : null;
    } else {
      // Termine tout ticket en_cours (cas générique)
      await conn.execute(
        "UPDATE tickets SET statut = 'termine', statut_appel = 'en_attente' WHERE statut = 'en_cours'"
      );
    }

    // 2. Trouver le prochain patient en attente (priorité puis ancienneté)
    const [waiting] = await conn.execute(`
      SELECT t.id, t.numero, t.priorite, t.created_at
      FROM tickets t
      WHERE t.statut = 'en_attente'
      ORDER BY
        CASE t.priorite WHEN 'tres_urgente' THEN 0 WHEN 'urgente' THEN 1 ELSE 2 END,
        t.created_at ASC
      LIMIT 1
    `);

    let next = null;
    if (waiting.length) {
      const nextId = waiting[0].id;
      await conn.execute(
        "UPDATE tickets SET statut = 'en_cours', statut_appel = 'en_consultation', salle = COALESCE(?, salle), medecin_appel = COALESCE(?, medecin_appel), appele_at = NOW() WHERE id = ?",
        [salle || null, medecin_appel || null, nextId]
      );
      const [rows] = await conn.execute('SELECT * FROM tickets WHERE id = ?', [nextId]);
      next = rows[0];
    }

    await conn.commit();
    conn.release();

    // 3. Notification hors transaction
    if (next) {
      try { await notifyPatientCalled(next.id); } catch (_) { /* notification best-effort */ }
    }

    return success(res, { ended, next }, next
      ? `Patient ${next.numero} appelé en consultation`
      : 'Consultation terminée — aucun patient en attente');
  } catch (e) {
    await conn.rollback();
    conn.release();
    return error(res, e.message, 500);
  }
};

module.exports = { getLive, getMyPosition, getDisplay, callNext, enrichQueue, notifyPatientCalled, sortQueue };
