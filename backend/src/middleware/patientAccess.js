const pool = require('../config/database');
const { error } = require('../utils/response');

const STAFF_ROLES = ['admin', 'medecin', 'receptionniste', 'caissier', 'laborantin', 'pharmacien'];

/**
 * Autorise l'accès à un dossier patient identifié par :id.
 * - Le personnel autorisé (staff) accède à tous les dossiers.
 * - Un patient n'accède qu'à son propre dossier.
 *
 * @param {string[]} staffRoles Rôles du personnel autorisés à tout voir.
 */
const authorizePatientAccess = (staffRoles = STAFF_ROLES) => async (req, res, next) => {
  try {
    if (staffRoles.includes(req.user.role)) return next();

    if (req.user.role !== 'patient') {
      return error(res, 'Accès non autorisé', 403);
    }

    const patientId = req.params.id || req.params.patientId;
    const [rows] = await pool.execute('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
    if (!rows.length) return error(res, 'Profil patient non trouvé', 404);

    if (String(rows[0].id) !== String(patientId)) {
      return error(res, 'Accès non autorisé à ce dossier patient', 403);
    }

    return next();
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { authorizePatientAccess, STAFF_ROLES };
