const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { buildSenegaleseAnnouncement } = require('../utils/announcementText');

const ANNOUNCE_DIR = path.join(__dirname, '../../uploads/announcements');
const TTS_URL = process.env.WOLOF_TTS_URL || 'http://localhost:8080/predict';
const TTS_TIMEOUT_MS = Number(process.env.WOLOF_TTS_TIMEOUT_MS || 2000);
const EDGE_VOICE = process.env.EDGE_TTS_VOICE || 'fr-FR-DeniseNeural';

let wolofTtsAvailable = null;
let wolofCheckAt = 0;

if (!fs.existsSync(ANNOUNCE_DIR)) {
  fs.mkdirSync(ANNOUNCE_DIR, { recursive: true });
}

const cacheKey = (text) => crypto.createHash('md5').update(text).digest('hex');

const findCachedAudio = (key) => {
  for (const ext of ['.wav', '.mp3']) {
    const filename = `announce-${key}${ext}`;
    const filepath = path.join(ANNOUNCE_DIR, filename);
    if (fs.existsSync(filepath)) {
      return {
        filepath,
        publicUrl: `/uploads/announcements/${filename}`,
        source: ext === '.wav' ? 'wolof-tts' : 'edge-tts',
      };
    }
  }
  return null;
};

const isWolofTtsAvailable = async () => {
  if (process.env.WOLOF_TTS_ENABLED === 'false') return false;

  if (Date.now() - wolofCheckAt < 60000 && wolofTtsAvailable !== null) {
    return wolofTtsAvailable;
  }

  try {
    const healthUrl = TTS_URL.replace(/\/predict\/?$/, '/health');
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(1500) });
    wolofTtsAvailable = res.ok;
  } catch {
    wolofTtsAvailable = false;
  }

  wolofCheckAt = Date.now();
  return wolofTtsAvailable;
};

const synthesizeWithWolofTts = async (text) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

  try {
    const res = await fetch(TTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'audio/*' },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 1000) throw new Error('Réponse audio TTS trop courte');
    return { buffer, ext: '.wav' };
  } finally {
    clearTimeout(timer);
  }
};

const synthesizeWithEdgeTts = async (text) => {
  const { UniversalEdgeTTS } = await import('edge-tts-universal');
  const tts = new UniversalEdgeTTS(text, EDGE_VOICE, {
    rate: '-10%',
    pitch: '-2Hz',
  });
  const result = await tts.synthesize();
  const buffer = Buffer.from(await result.audio.arrayBuffer());
  if (buffer.length < 500) throw new Error('Edge TTS: audio trop court');
  return { buffer, ext: '.mp3' };
};

const saveAudio = (key, buffer, ext, source) => {
  const filename = `announce-${key}${ext}`;
  fs.writeFileSync(path.join(ANNOUNCE_DIR, filename), buffer);
  return {
    audioUrl: `/uploads/announcements/${filename}`,
    source,
  };
};

const getOrCreateAnnouncementAudio = async ({ name, salle, medecin }) => {
  const texts = buildSenegaleseAnnouncement({ name, salle, medecin });
  const key = cacheKey(texts.speech);

  const cached = findCachedAudio(key);
  if (cached) {
    return { audioUrl: cached.publicUrl, source: cached.source, texts };
  }

  if (process.env.WOLOF_TTS_ENABLED === 'false' && process.env.EDGE_TTS_ENABLED === 'false') {
    return { audioUrl: null, source: 'browser', texts };
  }

  const errors = [];

  if (await isWolofTtsAvailable()) {
    try {
      const { buffer, ext } = await synthesizeWithWolofTts(texts.speech);
      return { ...saveAudio(key, buffer, ext, 'wolof-tts'), texts };
    } catch (e) {
      errors.push(`GalsenAI: ${e.message}`);
      wolofTtsAvailable = false;
      wolofCheckAt = Date.now();
    }
  }

  if (process.env.EDGE_TTS_ENABLED !== 'false') {
    try {
      const { buffer, ext } = await synthesizeWithEdgeTts(texts.speech);
      return { ...saveAudio(key, buffer, ext, 'edge-tts'), texts };
    } catch (e) {
      errors.push(`Edge TTS: ${e.message}`);
    }
  }

  if (errors.length) console.warn('[TTS]', errors.join(' | '));
  return { audioUrl: null, source: 'browser', texts, error: errors.join(' | ') };
};

const checkTtsHealth = async () => {
  const wolofAvailable = await isWolofTtsAvailable();
  const edgeAvailable = process.env.EDGE_TTS_ENABLED !== 'false';

  return {
    wolof_tts: wolofAvailable,
    edge_tts: edgeAvailable,
    available: wolofAvailable || edgeAvailable,
    url: TTS_URL,
  };
};

module.exports = {
  getOrCreateAnnouncementAudio,
  checkTtsHealth,
  buildSenegaleseAnnouncement,
};
