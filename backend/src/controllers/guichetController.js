const pool = require('../config/database');
const { success, error } = require('../utils/response');

const getAll = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM guichets ORDER BY nom');
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getActive = async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT id, nom FROM guichets WHERE actif = TRUE ORDER BY nom");
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const create = async (req, res) => {
  try {
    const { nom, etablissement_id, actif } = req.body;
    if (!nom?.trim()) return error(res, 'Nom du guichet requis', 400);
    const [result] = await pool.execute(
      'INSERT INTO guichets (nom, etablissement_id, actif) VALUES (?, ?, ?)',
      [nom.trim(), etablissement_id || null, actif !== false]
    );
    const [rows] = await pool.execute('SELECT * FROM guichets WHERE id = ?', [result.insertId]);
    return success(res, rows[0], 'Guichet créé', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const update = async (req, res) => {
  try {
    const { nom, etablissement_id, actif } = req.body;
    await pool.execute(
      'UPDATE guichets SET nom = COALESCE(?, nom), etablissement_id = ?, actif = COALESCE(?, actif) WHERE id = ?',
      [nom, etablissement_id ?? null, actif, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM guichets WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Guichet mis à jour');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const remove = async (req, res) => {
  try {
    await pool.execute('UPDATE guichets SET actif = FALSE WHERE id = ?', [req.params.id]);
    return success(res, null, 'Guichet désactivé');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { getAll, getActive, create, update, remove };
