const pool = require('../config/database');
const { success, error } = require('../utils/response');
const { analyzePrescription } = require('../utils/medicalAlerts');
const { sendSms, sendRdvReminder } = require('../utils/smsSimulator');
const { createNotification } = require('../utils/notifications');

const getTimeline = async (req, res) => {
  try {
    const patientId = req.params.id || req.params.patientId;
    const events = [];

    const [historique] = await pool.execute(`
      SELECT h.id, h.diagnostic, h.notes, h.date_consultation as date_event,
             u.prenom as medecin_prenom, u.nom as medecin_nom
      FROM historique_medical h
      LEFT JOIN medecins m ON h.medecin_id = m.id
      LEFT JOIN users u ON m.user_id = u.id
      WHERE h.patient_id = ?
    `, [patientId]);

    historique.forEach((h) => events.push({
      type: 'consultation',
      id: h.id,
      date: h.date_event,
      titre: h.diagnostic,
      details: h.notes,
      medecin: h.medecin_prenom ? `Dr. ${h.medecin_prenom} ${h.medecin_nom}` : null,
      icon: '🩺',
    }));

    const [analyses] = await pool.execute(
      'SELECT id, type_analyse, statut, date_demande, date_resultat FROM analyses WHERE patient_id = ?',
      [patientId]
    );
    analyses.forEach((a) => events.push({
      type: 'analyse',
      id: a.id,
      date: a.date_resultat || a.date_demande,
      titre: a.type_analyse,
      details: `Statut: ${a.statut}`,
      icon: '🧪',
    }));

    const [ordonnances] = await pool.execute(`
      SELECT o.id, o.medicaments, o.statut, o.date_creation,
             u.prenom as medecin_prenom, u.nom as medecin_nom
      FROM ordonnances o
      JOIN medecins m ON o.medecin_id = m.id
      JOIN users u ON m.user_id = u.id
      WHERE o.patient_id = ?
    `, [patientId]);
    ordonnances.forEach((o) => {
      const meds = typeof o.medicaments === 'string' ? JSON.parse(o.medicaments) : o.medicaments;
      events.push({
        type: 'ordonnance',
        id: o.id,
        date: o.date_creation,
        titre: `Ordonnance (${meds.length} médicament${meds.length > 1 ? 's' : ''})`,
        details: meds.map((m) => m.nom).join(', '),
        medecin: `Dr. ${o.medecin_prenom} ${o.medecin_nom}`,
        icon: '💊',
      });
    });

    const [tickets] = await pool.execute(
      'SELECT id, numero, service, statut, prix, paye, created_at FROM tickets WHERE patient_id = ?',
      [patientId]
    );
    tickets.forEach((t) => events.push({
      type: 'ticket',
      id: t.id,
      date: t.created_at,
      titre: `Ticket ${t.numero}`,
      details: `${t.service} — ${t.paye ? 'Payé' : 'Non payé'}`,
      icon: '🎫',
    }));

    const [rdvs] = await pool.execute(`
      SELECT r.id, r.date_heure, r.motif, r.statut, r.paye,
             u.prenom as medecin_prenom, u.nom as medecin_nom
      FROM rendez_vous r
      JOIN medecins m ON r.medecin_id = m.id
      JOIN users u ON m.user_id = u.id
      WHERE r.patient_id = ?
    `, [patientId]);
    rdvs.forEach((r) => events.push({
      type: 'rdv',
      id: r.id,
      date: r.date_heure,
      titre: 'Rendez-vous',
      details: r.motif || 'Consultation',
      medecin: `Dr. ${r.medecin_prenom} ${r.medecin_nom}`,
      icon: '📅',
    }));

    events.sort((a, b) => new Date(b.date) - new Date(a.date));
    return success(res, events);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const checkPrescription = async (req, res) => {
  try {
    const { patient_id, medicaments } = req.body;
    const [pat] = await pool.execute('SELECT allergies FROM patients WHERE id = ?', [patient_id]);
    if (!pat.length) return error(res, 'Patient non trouvé', 404);

    const result = await analyzePrescription(pool, pat[0].allergies, medicaments);
    return success(res, result);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const exportDossier = async (req, res) => {
  try {
    const patientId = req.params.id;

    if (req.user.role === 'patient') {
      const [pat] = await pool.execute('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
      if (!pat.length || String(pat[0].id) !== String(patientId)) {
        return error(res, 'Accès non autorisé', 403);
      }
    }

    const [rows] = await pool.execute(`
      SELECT p.*, u.nom, u.prenom, u.email, u.telephone
      FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?
    `, [patientId]);
    if (!rows.length) return error(res, 'Patient non trouvé', 404);
    const p = rows[0];

    const [historique] = await pool.execute(
      'SELECT diagnostic, notes, date_consultation FROM historique_medical WHERE patient_id = ? ORDER BY date_consultation DESC',
      [patientId]
    );
    const [analyses] = await pool.execute(
      'SELECT type_analyse, statut, date_demande FROM analyses WHERE patient_id = ?',
      [patientId]
    );
    const [ordonnances] = await pool.execute(
      'SELECT medicaments, date_creation, statut FROM ordonnances WHERE patient_id = ?',
      [patientId]
    );

    const content = `
DOSSIER MÉDICAL — MedikaSN
==========================
Exporté le ${new Date().toLocaleString('fr-FR')}

PATIENT
-------
Nom: ${p.prenom} ${p.nom}
Email: ${p.email}
Téléphone: ${p.telephone || '—'}
Date naissance: ${p.date_naissance || '—'}
Groupe sanguin: ${p.groupe_sanguin || '—'}
Allergies: ${p.allergies || 'Aucune déclarée'}
QR Code: ${p.qr_code}

CONSULTATIONS (${historique.length})
${historique.map((h, i) => `${i + 1}. [${new Date(h.date_consultation).toLocaleDateString('fr-FR')}] ${h.diagnostic}${h.notes ? ' — ' + h.notes : ''}`).join('\n') || 'Aucune'}

ANALYSES (${analyses.length})
${analyses.map((a, i) => `${i + 1}. ${a.type_analyse} — ${a.statut} (${new Date(a.date_demande).toLocaleDateString('fr-FR')})`).join('\n') || 'Aucune'}

ORDONNANCES (${ordonnances.length})
${ordonnances.map((o, i) => {
  const meds = typeof o.medicaments === 'string' ? JSON.parse(o.medicaments) : o.medicaments;
  return `${i + 1}. [${new Date(o.date_creation).toLocaleDateString('fr-FR')}] ${meds.map((m) => m.nom).join(', ')}`;
}).join('\n') || 'Aucune'}

---
Document généré par MedikaSN — Simulation export PDF (format texte)
    `.trim();

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=dossier-patient-${patientId}.txt`);
    return res.send(content);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getEtablissements = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM etablissements WHERE actif = TRUE ORDER BY nom');
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const createEtablissement = async (req, res) => {
  try {
    const { nom, adresse, telephone, ville } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO etablissements (nom, adresse, telephone, ville) VALUES (?, ?, ?, ?)',
      [nom, adresse, telephone, ville || 'Dakar']
    );
    return success(res, { id: result.insertId }, 'Établissement créé', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const sendRdvSms = async (req, res) => {
  try {
    const [rdv] = await pool.execute(`
      SELECT r.*, p.user_id, pu.telephone, pu.prenom
      FROM rendez_vous r
      JOIN patients p ON r.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      WHERE r.id = ?
    `, [req.params.id]);
    if (!rdv.length) return error(res, 'RDV non trouvé', 404);

    const sms = await sendRdvReminder(rdv[0], {
      user_id: rdv[0].user_id,
      telephone: rdv[0].telephone,
      prenom: rdv[0].prenom,
    });
    await pool.execute('UPDATE rendez_vous SET sms_rappel_envoye = TRUE WHERE id = ?', [req.params.id]);
    return success(res, sms, 'SMS rappel simulé envoyé');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getSmsHistory = async (req, res) => {
  try {
    let query = 'SELECT * FROM sms_simulations';
    const params = [];
    if (req.user.role === 'patient') {
      query += ' WHERE user_id = ?';
      params.push(req.user.id);
    }
    query += ' ORDER BY created_at DESC LIMIT 50';
    const [rows] = await pool.execute(query, params);
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = {
  getTimeline,
  checkPrescription,
  exportDossier,
  getEtablissements,
  createEtablissement,
  sendRdvSms,
  getSmsHistory,
};
