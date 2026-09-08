const pool = require('../config/database');

const logAction = async (userId, action, details = null, ip = null) => {
  try {
    await pool.execute(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
      [userId, action, details ? JSON.stringify(details) : null, ip]
    );
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
};

module.exports = { logAction };
