const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { success, error } = require('../utils/response');
const { logAction } = require('../utils/audit');

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const register = async (req, res) => {
  try {
    const { email, password, nom, prenom, telephone } = req.body;
    if (!email || !password || !nom || !prenom) {
      return error(res, 'Champs obligatoires manquants');
    }
    if (password.length < 8) {
      return error(res, 'Le mot de passe doit contenir au moins 8 caractères');
    }
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return error(res, 'Email déjà utilisé', 409);

    const hash = await bcrypt.hash(password, 10);

    // L'inscription publique ne crée que des comptes patient.
    // Les comptes du personnel sont créés par un admin via /admin/personnel.
    const userRole = 'patient';

    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, role, nom, prenom, telephone) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hash, userRole, nom, prenom, telephone || null]
    );
    const userId = result.insertId;

    const qrCode = `PAT-${userId}-${Date.now().toString(36).toUpperCase()}`;
    await pool.execute(
      'INSERT INTO patients (user_id, qr_code) VALUES (?, ?)',
      [userId, qrCode]
    );

    const [users] = await pool.execute(
      'SELECT id, email, role, nom, prenom, telephone FROM users WHERE id = ?',
      [userId]
    );
    const user = users[0];
    await logAction(userId, 'REGISTER', { email }, req.ip);
    return success(res, { user, token: generateToken(user) }, 'Compte créé', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email et mot de passe requis');

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND actif = TRUE',
      [email]
    );
    if (!users.length) return error(res, 'Identifiants incorrects', 401);

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return error(res, 'Identifiants incorrects', 401);

    const { password_hash, ...safeUser } = user;
    await logAction(user.id, 'LOGIN', null, req.ip);
    return success(res, { user: safeUser, token: generateToken(safeUser) }, 'Connexion réussie');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const me = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, email, role, nom, prenom, telephone, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!users.length) return error(res, 'Utilisateur non trouvé', 404);

    const user = users[0];
    let profile = null;

    if (user.role === 'patient') {
      const [p] = await pool.execute('SELECT * FROM patients WHERE user_id = ?', [user.id]);
      profile = p[0] || null;
    } else if (user.role === 'medecin') {
      const [m] = await pool.execute('SELECT * FROM medecins WHERE user_id = ?', [user.id]);
      profile = m[0] || null;
    }

    return success(res, { user, profile });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { register, login, me };
