const pool = require('../config/database');
const { success, error } = require('../utils/response');
const { getOrCreateAnnouncementAudio, checkTtsHealth } = require('../services/ttsService');
const { enrichQueue } = require('./queueController');

const getActiveTicketForAnnounce = async (numero) => {
  let query = `
    SELECT t.numero, t.statut, t.statut_appel, t.salle, t.medecin_appel, t.appele_at,
           u.prenom, u.nom
    FROM tickets t
    JOIN patients p ON t.patient_id = p.id
    JOIN users u ON p.user_id = u.id
    WHERE t.statut IN ('en_attente','en_cours')
  `;
  const params = [];
  if (numero) {
    query += ' AND t.numero = ?';
    params.push(numero);
  }
  const [rows] = await pool.execute(query, params);
  const queue = enrichQueue(rows);
  const appele = queue.find((t) => t.statut_appel === 'appele' && t.statut === 'en_attente');
  const enCours = queue.find((t) => t.statut === 'en_cours');
  return appele || enCours || null;
};

const getAnnounceAudio = async (req, res) => {
  try {
    const ticket = await getActiveTicketForAnnounce(req.query.numero);
    if (!ticket) {
      return success(res, { audioUrl: null, source: 'none', message: 'Aucun patient appelé' });
    }

    const name = `${ticket.prenom} ${ticket.nom || ''}`.trim();
    const result = await getOrCreateAnnouncementAudio({
      name,
      salle: ticket.salle,
      medecin: ticket.medecin_appel,
    });

    return success(res, {
      audioUrl: result.audioUrl,
      source: result.source,
      texts: result.texts,
      ticket: {
        numero: ticket.numero,
        name,
        salle: ticket.salle,
        medecin: ticket.medecin_appel,
        statut_appel: ticket.statut_appel,
        appele_at: ticket.appele_at,
      },
    });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getTtsStatus = async (req, res) => {
  const health = await checkTtsHealth();
  let hint = 'Voix navigateur uniquement';
  if (health.wolof_tts) hint = 'Voix wolof GalsenAI active (100% sénégalaise)';
  else if (health.edge_tts) hint = 'Voix Edge TTS intégrée (sans Docker) — relancez setup-wolof-tts.ps1 pour GalsenAI';
  else hint = 'Installez Docker + scripts/setup-wolof-tts.ps1 pour la voix wolof';

  return success(res, {
    ...health,
    enabled: process.env.WOLOF_TTS_ENABLED !== 'false' || process.env.EDGE_TTS_ENABLED !== 'false',
    hint,
  });
};

module.exports = { getAnnounceAudio, getTtsStatus };
