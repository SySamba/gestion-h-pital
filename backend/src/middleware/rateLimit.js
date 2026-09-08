const { error } = require('../utils/response');

/**
 * Limiteur de requêtes en mémoire (fenêtre glissante simple).
 * Suffisant pour un déploiement mono-instance ; pour du multi-instance,
 * remplacer le store par Redis.
 *
 * @param {object} options
 * @param {number} options.windowMs Durée de la fenêtre en millisecondes.
 * @param {number} options.max Nombre maximum de requêtes par fenêtre.
 * @param {string} options.message Message renvoyé lorsque la limite est atteinte.
 */
const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 10, message = 'Trop de tentatives. Réessayez plus tard.' } = {}) => {
  const hits = new Map();

  const cleanup = () => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now > entry.resetAt) hits.delete(key);
    }
  };

  const timer = setInterval(cleanup, windowMs);
  if (timer.unref) timer.unref();

  return (req, res, next) => {
    const key = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return error(res, message, 429);
    }

    return next();
  };
};

module.exports = rateLimit;
