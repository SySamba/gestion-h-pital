const pool = require('../config/database');
const { success, error } = require('../utils/response');

const getAll = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const markRead = async (req, res) => {
  try {
    await pool.execute('UPDATE notifications SET lu = TRUE WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.id,
    ]);
    return success(res, null, 'Notification lue');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const markAllRead = async (req, res) => {
  try {
    await pool.execute('UPDATE notifications SET lu = TRUE WHERE user_id = ?', [req.user.id]);
    return success(res, null, 'Toutes les notifications lues');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { getAll, markRead, markAllRead };
