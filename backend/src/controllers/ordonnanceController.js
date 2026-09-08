const pool = require('../config/database');
const { success, error } = require('../utils/response');
const { createNotification } = require('../utils/notifications');
const { analyzePrescription } = require('../utils/medicalAlerts');

const create = async (req, res) => {
  try {
    const { patient_id, medicaments, instructions, force } = req.body;
    const [med] = await pool.execute('SELECT id FROM medecins WHERE user_id = ?', [req.user.id]);
    if (!med.length) return error(res, 'Profil médecin requis', 400);

    const [pat] = await pool.execute('SELECT allergies FROM patients WHERE id = ?', [patient_id]);
    if (!pat.length) return error(res, 'Patient non trouvé', 404);

    const alertResult = await analyzePrescription(pool, pat[0].allergies, medicaments);
    if (alertResult.hasDanger && !force) {
      return error(res, 'Alertes médicales détectées — vérifiez les allergies', 422, {
        alerts: alertResult.alerts,
        hasDanger: true,
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO ordonnances (patient_id, medecin_id, medicaments, instructions) VALUES (?, ?, ?, ?)',
      [patient_id, med[0].id, JSON.stringify(medicaments), instructions || null]
    );

    const [pu] = await pool.execute('SELECT user_id FROM patients WHERE id = ?', [patient_id]);
    if (pu[0]) {
      await createNotification(pu[0].user_id, 'Nouvelle ordonnance', 'Une ordonnance a été prescrite', 'ordonnance');
    }
    return success(res, {
      id: result.insertId,
      alerts: alertResult.alerts,
    }, 'Ordonnance créée', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getAll = async (req, res) => {
  try {
    let query = `
      SELECT o.*, pu.nom as patient_nom, pu.prenom as patient_prenom,
             mu.nom as medecin_nom, mu.prenom as medecin_prenom
      FROM ordonnances o
      JOIN patients p ON o.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN medecins m ON o.medecin_id = m.id
      JOIN users mu ON m.user_id = mu.id
    `;
    const params = [];

    if (req.user.role === 'patient') {
      const [pat] = await pool.execute('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
      query += ' WHERE o.patient_id = ?';
      params.push(pat[0]?.id);
    }

    query += ' ORDER BY o.date_creation DESC';
    const [rows] = await pool.execute(query, params);
    const parsed = rows.map((r) => ({
      ...r,
      medicaments: typeof r.medicaments === 'string' ? JSON.parse(r.medicaments) : r.medicaments,
    }));
    return success(res, parsed);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getPdf = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT o.*, pu.nom as patient_nom, pu.prenom as patient_prenom,
             mu.nom as medecin_nom, mu.prenom as medecin_prenom, m.specialite
      FROM ordonnances o
      JOIN patients p ON o.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN medecins m ON o.medecin_id = m.id
      JOIN users mu ON m.user_id = mu.id
      WHERE o.id = ?
    `, [req.params.id]);

    if (!rows.length) return error(res, 'Ordonnance non trouvée', 404);
    const o = rows[0];

    const { generateOrdonnancePDF } = require('../utils/pdfGenerator');
    const doc = generateOrdonnancePDF(o);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ordonnance-${o.id}.pdf`);
    doc.pipe(res);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const deliver = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM ordonnances WHERE id = ?', [req.params.id]);
    if (!rows.length) return error(res, 'Ordonnance non trouvée', 404);
    if (rows[0].statut !== 'active') return error(res, 'Ordonnance déjà traitée', 400);

    await pool.execute("UPDATE ordonnances SET statut = 'delivree' WHERE id = ?", [req.params.id]);

    const [pu] = await pool.execute('SELECT user_id FROM patients WHERE id = ?', [rows[0].patient_id]);
    if (pu[0]) {
      await createNotification(pu[0].user_id, 'Ordonnance délivrée', 'Vos médicaments ont été délivrés à la pharmacie', 'ordonnance');
    }
    return success(res, { id: req.params.id, statut: 'delivree' }, 'Ordonnance délivrée');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { create, getAll, getPdf, deliver };
