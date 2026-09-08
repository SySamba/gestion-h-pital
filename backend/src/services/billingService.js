const pool = require('../config/database');

const generateFactureNum = () => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `FAC-${ymd}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
};

const PRIX_ANALYSES = {
  'numération formule sanguine (nfs)': 5000,
  'glycémie à jeun': 3000,
  'ecg': 10000,
  'test rapide paludisme (tdr)': 2000,
  'bilan lipidique': 8000,
  'groupe sanguin': 3500,
  'urée': 2500,
  'créatinine': 3000,
  'transaminases': 4000,
  'radiographie': 15000,
  'échographie': 20000,
  'scanner': 75000,
};

const getPrixAnalyse = (type) => {
  const key = (type || '').toLowerCase().trim();
  return PRIX_ANALYSES[key] || 5000;
};

const getPatientName = async (patientId) => {
  const [rows] = await pool.execute(
    'SELECT u.nom, u.prenom FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?',
    [patientId]
  );
  if (!rows.length) return null;
  return `${rows[0].prenom} ${rows[0].nom}`;
};

/**
 * Crée ou récupère une facture "en cours" pour un patient.
 * Une facture en cours = statut 'impayee' créée aujourd'hui sans paiement.
 * On regroupe les services d'une même journée sur une seule facture.
 */
const getOrCreateFactureEnCours = async (conn, patientId, patientNom) => {
  const [existing] = await conn.execute(
    `SELECT * FROM factures
     WHERE patient_id = ? AND statut = 'impayee' AND montant_paye = 0 AND DATE(date_creation) = CURDATE()
     ORDER BY date_creation DESC LIMIT 1`,
    [patientId]
  );

  if (existing.length) return existing[0];

  const numero = generateFactureNum();
  const [result] = await conn.execute(
    "INSERT INTO factures (numero, patient_id, patient_nom, caissier_id, montant_total, montant_paye, statut, source) VALUES (?, ?, ?, NULL, 0, 0, 'impayee', 'auto')",
    [numero, patientId, patientNom]
  );

  const [rows] = await conn.execute('SELECT * FROM factures WHERE id = ?', [result.insertId]);
  return rows[0];
};

/**
 * Ajoute une ligne de facture et recalcule le montant total.
 */
const addLigneToFacture = async (conn, factureId, libelle, typeService, montant, referenceId = null) => {
  await conn.execute(
    'INSERT INTO facture_lignes (facture_id, libelle, type_service, montant, reference_id) VALUES (?, ?, ?, ?, ?)',
    [factureId, libelle, typeService, montant, referenceId]
  );

  await conn.execute(
    'UPDATE factures SET montant_total = (SELECT COALESCE(SUM(montant), 0) FROM facture_lignes WHERE facture_id = ?) WHERE id = ?',
    [factureId, factureId]
  );
};

/**
 * Exécute l'ajout d'une ligne de facturation dans une transaction.
 * Garantit qu'une facture n'est jamais créée sans sa ligne associée.
 */
const facturer = async (patientId, libelle, typeService, montant, referenceId) => {
  const patientNom = await getPatientName(patientId);
  if (!patientNom) return null;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const facture = await getOrCreateFactureEnCours(conn, patientId, patientNom);
    await addLigneToFacture(conn, facture.id, libelle, typeService, montant, referenceId);
    await conn.commit();
    return facture.id;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

/**
 * Facturation automatique d'un ticket (consultation).
 * Appelé lors de la création d'un ticket par la réception ou le patient.
 */
const facturerTicket = async (ticketId, patientId, service, prix) => {
  try {
    return await facturer(patientId, service || 'Consultation générale', 'consultation', prix, ticketId);
  } catch (e) {
    console.error('billingService.facturerTicket error:', e.message);
    return null;
  }
};

/**
 * Facturation automatique d'une analyse de laboratoire.
 * Appelé lors de la demande d'analyse par le médecin.
 */
const facturerAnalyse = async (analyseId, patientId, typeAnalyse) => {
  try {
    const prix = getPrixAnalyse(typeAnalyse);
    return await facturer(patientId, `Analyse: ${typeAnalyse}`, 'analyse', prix, analyseId);
  } catch (e) {
    console.error('billingService.facturerAnalyse error:', e.message);
    return null;
  }
};

/**
 * Facturation automatique d'une vente pharmacie.
 * Appelé lors de l'enregistrement d'une vente.
 */
const facturerVente = async (venteId, patientId, medicamentNom, quantite, prixTotal) => {
  try {
    if (!patientId) return null;
    return await facturer(patientId, `Pharmacie: ${medicamentNom} x${quantite}`, 'pharmacie', prixTotal, venteId);
  } catch (e) {
    console.error('billingService.facturerVente error:', e.message);
    return null;
  }
};

module.exports = {
  facturerTicket,
  facturerAnalyse,
  facturerVente,
  getPrixAnalyse,
  generateFactureNum,
};
