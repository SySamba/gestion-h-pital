const pool = require('../config/database');

const createNotification = async (userId, titre, message, type = 'systeme') => {
  await pool.execute(
    'INSERT INTO notifications (user_id, titre, message, type) VALUES (?, ?, ?, ?)',
    [userId, titre, message, type]
  );
};

module.exports = { createNotification };
