/** Règles d'alertes médicales — allergies et interactions courantes */

const ALLERGY_DRUG_RULES = [
  { keywords: ['pénicilline', 'penicilline', 'penicillin'], drugs: ['amoxicilline', 'augmentin', 'ampicilline', 'penicilline'] },
  { keywords: ['aspirine', 'salicylate'], drugs: ['aspirine', 'acide acétylsalicylique', 'aspegic'] },
  { keywords: ['ibuprofène', 'ibuprofen', 'ains'], drugs: ['ibuprofène', 'ibuprofen', 'diclofénac', 'naproxène'] },
  { keywords: ['sulfamide', 'sulfamethoxazole'], drugs: ['bactrim', 'sulfamethoxazole', 'cotrimoxazole'] },
  { keywords: ['latex'], drugs: ['latex'] },
];

const DRUG_INTERACTIONS = [
  { drugs: ['ibuprofène', 'ibuprofen'], withDrugs: ['aspirine', 'warfarine', 'anticoagulant'], severity: 'warning', message: 'Interaction possible avec anticoagulants ou aspirine — surveiller le patient.' },
  { drugs: ['amoxicilline'], withDrugs: ['paracétamol'], severity: 'info', message: 'Association courante — vérifier la posologie.' },
  { drugs: ['paracétamol'], withDrugs: ['alcool'], severity: 'warning', message: 'Éviter l\'alcool pendant le traitement au paracétamol.' },
];

const checkAllergies = (allergiesText, medicaments) => {
  if (!allergiesText || !medicaments?.length) return [];
  const allergyLower = allergiesText.toLowerCase();
  const alerts = [];

  medicaments.forEach((med) => {
    const medName = (med.nom || '').toLowerCase();
    if (!medName) return;

    ALLERGY_DRUG_RULES.forEach((rule) => {
      const hasAllergy = rule.keywords.some((k) => allergyLower.includes(k));
      const matchesDrug = rule.drugs.some((d) => medName.includes(d));
      if (hasAllergy && matchesDrug) {
        alerts.push({
          type: 'allergie',
          severity: 'danger',
          medicament: med.nom,
          message: `⚠️ ALLERGIE : ${med.nom} peut contenir un allergène lié à « ${allergiesText} »`,
        });
      }
    });

    if (allergyLower.split(/[,;]/).some((a) => a.trim() && medName.includes(a.trim().toLowerCase()))) {
      alerts.push({
        type: 'allergie',
        severity: 'danger',
        medicament: med.nom,
        message: `⚠️ ALLERGIE : ${med.nom} correspond directement à une allergie déclarée`,
      });
    }
  });

  return alerts;
};

const checkInteractions = (medicaments) => {
  if (!medicaments?.length || medicaments.length < 2) return [];
  const alerts = [];
  const names = medicaments.map((m) => (m.nom || '').toLowerCase()).filter(Boolean);

  DRUG_INTERACTIONS.forEach((rule) => {
    const hasA = names.some((n) => rule.drugs.some((d) => n.includes(d)));
    const hasB = names.some((n) => rule.withDrugs.some((d) => n.includes(d)));
    if (hasA && hasB) {
      alerts.push({
        type: 'interaction',
        severity: rule.severity,
        message: rule.message,
      });
    }
  });

  return alerts;
};

const checkStock = async (pool, medicaments) => {
  const alerts = [];
  for (const med of medicaments) {
    const name = (med.nom || '').trim();
    if (!name) continue;
    const [rows] = await pool.execute(
      'SELECT nom, stock, seuil_alerte FROM medicaments WHERE LOWER(nom) LIKE ? LIMIT 1',
      [`%${name.toLowerCase()}%`]
    );
    if (rows[0]) {
      if (rows[0].stock <= 0) {
        alerts.push({ type: 'stock', severity: 'warning', medicament: rows[0].nom, message: `Stock épuisé pour ${rows[0].nom} en pharmacie` });
      } else if (rows[0].stock <= rows[0].seuil_alerte) {
        alerts.push({ type: 'stock', severity: 'info', medicament: rows[0].nom, message: `Stock faible pour ${rows[0].nom} (${rows[0].stock} restants)` });
      }
    }
  }
  return alerts;
};

const analyzePrescription = async (pool, allergies, medicaments) => {
  const allergyAlerts = checkAllergies(allergies, medicaments);
  const interactionAlerts = checkInteractions(medicaments);
  const stockAlerts = await checkStock(pool, medicaments);
  const all = [...allergyAlerts, ...interactionAlerts, ...stockAlerts];
  const hasDanger = all.some((a) => a.severity === 'danger');
  return { alerts: all, hasDanger, canProceed: !hasDanger };
};

module.exports = { analyzePrescription, checkAllergies, checkInteractions };
