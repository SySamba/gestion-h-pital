const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { success, error } = require('../utils/response');

const STAFF_ROLES = ['medecin', 'receptionniste', 'laborantin', 'pharmacien', 'caissier', 'admin'];

const createStaff = async (req, res) => {
  try {
    const { email, password, nom, prenom, telephone, role, specialite } = req.body;
    if (!email || !password || !nom || !prenom || !role) {
      return error(res, 'email, password, nom, prenom et role requis', 400);
    }
    if (!STAFF_ROLES.includes(role)) return error(res, 'Rôle invalide', 400);

    const [exists] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) return error(res, 'Email déjà utilisé', 400);

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, role, nom, prenom, telephone) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hash, role, nom, prenom, telephone || null]
    );

    if (role === 'medecin') {
      await pool.execute(
        'INSERT INTO medecins (user_id, specialite) VALUES (?, ?)',
        [result.insertId, specialite || 'Médecine générale']
      );
    }

    const [rows] = await pool.execute('SELECT id, email, role, nom, prenom, telephone, actif FROM users WHERE id = ?', [result.insertId]);
    return success(res, rows[0], 'Compte personnel créé', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const updateStaff = async (req, res) => {
  try {
    const { nom, prenom, telephone, role, actif, specialite, password } = req.body;
    const userId = req.params.id;

    const updates = [];
    const params = [];

    if (nom) { updates.push('nom = ?'); params.push(nom); }
    if (prenom) { updates.push('prenom = ?'); params.push(prenom); }
    if (telephone !== undefined) { updates.push('telephone = ?'); params.push(telephone); }
    if (role && STAFF_ROLES.includes(role)) { updates.push('role = ?'); params.push(role); }
    if (actif !== undefined) { updates.push('actif = ?'); params.push(actif ? 1 : 0); }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      params.push(hash);
    }

    if (updates.length) {
      params.push(userId);
      await pool.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    if (specialite !== undefined) {
      const [med] = await pool.execute('SELECT id FROM medecins WHERE user_id = ?', [userId]);
      if (med[0]) {
        await pool.execute('UPDATE medecins SET specialite = ? WHERE user_id = ?', [specialite, userId]);
      } else {
        const [u] = await pool.execute('SELECT role FROM users WHERE id = ?', [userId]);
        if (u[0]?.role === 'medecin') {
          await pool.execute('INSERT INTO medecins (user_id, specialite) VALUES (?, ?)', [userId, specialite]);
        }
      }
    }

    const [rows] = await pool.execute(
      `SELECT u.id, u.email, u.role, u.nom, u.prenom, u.telephone, u.actif, m.specialite
       FROM users u LEFT JOIN medecins m ON m.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );
    return success(res, rows[0], 'Compte mis à jour');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getMedecinsAdmin = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT m.id, m.specialite, u.id as user_id, u.nom, u.prenom, u.email, u.telephone, u.actif
      FROM medecins m
      JOIN users u ON m.user_id = u.id
      ORDER BY u.nom, u.prenom
    `);
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const updateMedecin = async (req, res) => {
  try {
    const { specialite, actif } = req.body;
    const [med] = await pool.execute('SELECT user_id FROM medecins WHERE id = ?', [req.params.id]);
    if (!med[0]) return error(res, 'Médecin introuvable', 404);

    if (specialite) {
      await pool.execute('UPDATE medecins SET specialite = ? WHERE id = ?', [specialite, req.params.id]);
    }
    if (actif !== undefined) {
      await pool.execute('UPDATE users SET actif = ? WHERE id = ?', [actif ? 1 : 0, med[0].user_id]);
    }

    const [rows] = await pool.execute(`
      SELECT m.id, m.specialite, u.id as user_id, u.nom, u.prenom, u.email, u.telephone, u.actif
      FROM medecins m JOIN users u ON m.user_id = u.id WHERE m.id = ?
    `, [req.params.id]);
    return success(res, rows[0], 'Médecin mis à jour');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { createStaff, updateStaff, getMedecinsAdmin, updateMedecin, STAFF_ROLES };
