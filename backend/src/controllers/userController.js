const pool = require('../config/database');
const { success, error } = require('../utils/response');

const getAll = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, email, role, nom, prenom, telephone, actif, created_at FROM users ORDER BY created_at DESC'
    );
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const updateRole = async (req, res) => {
  try {
    const { role, actif } = req.body;
    await pool.execute(
      'UPDATE users SET role = COALESCE(?, role), actif = COALESCE(?, actif) WHERE id = ?',
      [role, actif, req.params.id]
    );
    const [rows] = await pool.execute(
      'SELECT id, email, role, nom, prenom, actif FROM users WHERE id = ?',
      [req.params.id]
    );
    return success(res, rows[0], 'Utilisateur mis à jour');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { getAll, updateRole };
