const pool = require('../config/database');
const { success, error } = require('../utils/response');

const getStats = async (req, res) => {
  try {
    const [[patients]] = await pool.execute('SELECT COUNT(*) as total FROM patients');
    const [[rdvToday]] = await pool.execute(
      "SELECT COUNT(*) as total FROM rendez_vous WHERE DATE(date_heure) = CURDATE() AND statut != 'annule'"
    );
    const [[analysesPending]] = await pool.execute(
      "SELECT COUNT(*) as total FROM analyses WHERE statut IN ('demande','en_cours')"
    );
    const [[medicaments]] = await pool.execute('SELECT COUNT(*) as total FROM medicaments');
    const [[revenus]] = await pool.execute(
      'SELECT COALESCE(SUM(prix),0) as total FROM tickets WHERE DATE(created_at) = CURDATE() AND statut != \'annule\''
    );
    const [[revenusSemaine]] = await pool.execute(
      'SELECT COALESCE(SUM(prix),0) as total FROM tickets WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND statut != \'annule\''
    );
    const [[ticketsToday]] = await pool.execute(
      'SELECT COUNT(*) as total FROM tickets WHERE DATE(created_at) = CURDATE()'
    );
    const [[queueNow]] = await pool.execute(
      "SELECT COUNT(*) as total FROM tickets WHERE statut IN ('en_attente','en_cours')"
    );
    const [[users]] = await pool.execute('SELECT COUNT(*) as total FROM users WHERE actif = TRUE');
    const [[consultationsMois]] = await pool.execute(
      'SELECT COUNT(*) as total FROM historique_medical WHERE date_consultation >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)'
    );

    return success(res, {
      patients: patients.total,
      rendez_vous_aujourdhui: rdvToday.total,
      analyses_en_attente: analysesPending.total,
      medicaments_referentiel: medicaments.total,
      revenus_journaliers: parseFloat(revenus.total),
      revenus_semaine: parseFloat(revenusSemaine.total),
      tickets_aujourdhui: ticketsToday.total,
      file_attente: queueNow.total,
      utilisateurs_actifs: users.total,
      consultations_mois: consultationsMois.total,
    });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getOverview = async (req, res) => {
  try {
    const [rdvToday] = await pool.execute(`
      SELECT r.*, pu.prenom as patient_prenom, pu.nom as patient_nom,
             mu.prenom as medecin_prenom, mu.nom as medecin_nom
      FROM rendez_vous r
      JOIN patients p ON r.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN medecins m ON r.medecin_id = m.id
      JOIN users mu ON m.user_id = mu.id
      WHERE DATE(r.date_heure) = CURDATE()
      ORDER BY r.date_heure ASC LIMIT 8
    `);

    const [queue] = await pool.execute(`
      SELECT t.*, u.prenom, u.nom FROM tickets t
      JOIN patients p ON t.patient_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE t.statut IN ('en_attente','en_cours')
      ORDER BY t.created_at ASC LIMIT 6
    `);

    const [recentActivity] = await pool.execute(`
      (SELECT 'rdv' as type, CONCAT(pu.prenom,' ',pu.nom) as label,
              r.date_heure as date_event, r.statut
       FROM rendez_vous r
       JOIN patients p ON r.patient_id = p.id JOIN users pu ON p.user_id = pu.id
       ORDER BY r.created_at DESC LIMIT 3)
      UNION ALL
      (SELECT 'analyse' as type, a.type_analyse as label,
              a.date_demande as date_event, a.statut
       FROM analyses a ORDER BY a.date_demande DESC LIMIT 3)
      UNION ALL
      (SELECT 'ticket' as type, t.numero as label,
              t.created_at as date_event, t.statut
       FROM tickets t ORDER BY t.created_at DESC LIMIT 3)
      ORDER BY date_event DESC LIMIT 8
    `);

    const [weeklyRdv] = await pool.execute(`
      SELECT DAYNAME(date_heure) as jour, COUNT(*) as total
      FROM rendez_vous
      WHERE date_heure >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(date_heure), DAYNAME(date_heure)
      ORDER BY date_heure
    `);

    return success(res, {
      rendez_vous: rdvToday,
      file_attente: queue,
      activite_recente: recentActivity,
      rdv_semaine: weeklyRdv,
    });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const search = async (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const [patients] = await pool.execute(`
      SELECT p.id, u.nom, u.prenom, u.email, u.telephone, p.qr_code
      FROM patients p JOIN users u ON p.user_id = u.id
      WHERE u.nom LIKE ? OR u.prenom LIKE ? OR u.email LIKE ? OR u.telephone LIKE ? OR p.qr_code LIKE ?
         OR CONCAT(u.prenom, ' ', u.nom) LIKE ?
      LIMIT 20
    `, [q, q, q, q, q, q]);
    return success(res, patients);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { getStats, getOverview, search };
