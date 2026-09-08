const pool = require('../config/database');
const hospital = require('../config/hospital');

const DEFAULTS = {
  nom_hopital: hospital.nom,
  slogan: hospital.slogan,
  adresse: hospital.adresse,
  telephone: hospital.telephone,
  email: hospital.email,
  ticket_duree_minutes: 120,
  ticket_prix: 5000,
  temps_attente_moyen_min: 8,
  annonce_repetitions: 3,
};

const mapRow = (row) => ({
  nom: row.nom_hopital,
  slogan: row.slogan,
  adresse: row.adresse,
  telephone: row.telephone,
  email: row.email,
  devise: hospital.devise,
  pays: hospital.pays,
  version: hospital.version,
  ticket_duree_minutes: row.ticket_duree_minutes,
  ticket_prix: Number(row.ticket_prix),
  temps_attente_moyen_min: row.temps_attente_moyen_min,
  annonce_repetitions: row.annonce_repetitions,
});

const getSettings = async () => {
  try {
    const [rows] = await pool.execute('SELECT * FROM system_settings WHERE id = 1');
    if (rows[0]) return mapRow(rows[0]);
  } catch {
    /* table may not exist yet */
  }
  return { ...DEFAULTS, nom: DEFAULTS.nom_hopital, devise: hospital.devise, pays: hospital.pays, version: hospital.version };
};

const updateSettings = async (body) => {
  const fields = [];
  const params = [];
  const allowed = {
    nom_hopital: 'nom_hopital',
    nom: 'nom_hopital',
    slogan: 'slogan',
    adresse: 'adresse',
    telephone: 'telephone',
    email: 'email',
    ticket_duree_minutes: 'ticket_duree_minutes',
    ticket_prix: 'ticket_prix',
    temps_attente_moyen_min: 'temps_attente_moyen_min',
    annonce_repetitions: 'annonce_repetitions',
  };

  Object.entries(body).forEach(([key, val]) => {
    if (allowed[key] !== undefined && val !== undefined) {
      fields.push(`${allowed[key]} = ?`);
      params.push(val);
    }
  });

  if (!fields.length) return getSettings();

  await pool.execute(`UPDATE system_settings SET ${fields.join(', ')} WHERE id = 1`, params);
  return getSettings();
};

module.exports = { getSettings, updateSettings, DEFAULTS };
