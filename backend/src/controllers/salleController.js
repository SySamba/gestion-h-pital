const pool = require('../config/database');
const { success, error } = require('../utils/response');

const getAll = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT s.*, u.prenom as medecin_prenom, u.nom as medecin_nom, m.specialite
      FROM salles s
      LEFT JOIN medecins m ON s.medecin_id = m.id
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY s.nom
    `);
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getActive = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, nom, type, medecin_id FROM salles WHERE actif = TRUE ORDER BY nom"
    );
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const create = async (req, res) => {
  try {
    const { nom, type, medecin_id, etablissement_id, actif } = req.body;
    if (!nom?.trim()) return error(res, 'Nom de salle requis', 400);
    const [result] = await pool.execute(
      'INSERT INTO salles (nom, type, medecin_id, etablissement_id, actif) VALUES (?, ?, ?, ?, ?)',
      [nom.trim(), type || 'consultation', medecin_id || null, etablissement_id || null, actif !== false]
    );
    const [rows] = await pool.execute('SELECT * FROM salles WHERE id = ?', [result.insertId]);
    return success(res, rows[0], 'Salle créée', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const update = async (req, res) => {
  try {
    const { nom, type, medecin_id, etablissement_id, actif } = req.body;
    await pool.execute(
      `UPDATE salles SET
        nom = COALESCE(?, nom),
        type = COALESCE(?, type),
        medecin_id = ?,
        etablissement_id = ?,
        actif = COALESCE(?, actif)
       WHERE id = ?`,
      [nom, type, medecin_id ?? null, etablissement_id ?? null, actif, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM salles WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Salle mise à jour');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const remove = async (req, res) => {
  try {
    await pool.execute('UPDATE salles SET actif = FALSE WHERE id = ?', [req.params.id]);
    return success(res, null, 'Salle désactivée');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { getAll, getActive, create, update, remove };
