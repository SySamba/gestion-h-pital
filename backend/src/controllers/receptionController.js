const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { success, error } = require('../utils/response');

const DEFAULT_PASSWORD = 'password123';

const generateNumero = async () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const [count] = await pool.execute(
    'SELECT COUNT(*) as c FROM tickets WHERE DATE(created_at) = CURDATE()'
  );
  return `T-${date}-${String(count[0].c + 1).padStart(3, '0')}`;
};

const generateEmail = (telephone, prenom, nom) => {
  const digits = (telephone || '').replace(/\D/g, '').slice(-9);
  const slug = `${(prenom || 'patient').toLowerCase().replace(/[^a-z0-9]/g, '')}.${(nom || 'sn').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  return digits ? `p${digits}@patient.medikasn.sn` : `${slug}${Date.now().toString(36).slice(-4)}@patient.medikasn.sn`;
};

const ageToBirthDate = (age) => {
  const y = new Date().getFullYear() - Number(age);
  return `${y}-01-01`;
};

const splitFullName = (fullName) => {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { prenom: 'Patient', nom: 'Inconnu' };
  if (parts.length === 1) return { prenom: parts[0], nom: parts[0] };
  return { prenom: parts[0], nom: parts.slice(1).join(' ') };
};

const createPatientAccount = async ({ email, password, nom, prenom, telephone, date_naissance, sexe, allergies, adresse }) => {
  const finalEmail = email || generateEmail(telephone, prenom, nom);
  const finalPassword = password || DEFAULT_PASSWORD;
  const hash = await bcrypt.hash(finalPassword, 10);

  const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [finalEmail]);
  if (existing.length) {
    const err = new Error('Un compte existe déjà avec cet email');
    err.code = 'DUPLICATE';
    throw err;
  }

  const [result] = await pool.execute(
    'INSERT INTO users (email, password_hash, role, nom, prenom, telephone) VALUES (?, ?, ?, ?, ?, ?)',
    [finalEmail, hash, 'patient', nom, prenom, telephone || null]
  );
  const userId = result.insertId;
  const qrCode = `PAT-${userId}-${Date.now().toString(36).toUpperCase()}`;
  const [patResult] = await pool.execute(
    'INSERT INTO patients (user_id, date_naissance, sexe, allergies, qr_code, adresse) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, date_naissance || null, sexe || null, allergies || null, qrCode, adresse || null]
  );

  return {
    userId,
    patient_id: patResult.insertId,
    qrCode,
    credentials: {
      email: finalEmail,
      password: finalPassword,
      message: 'Le patient peut se connecter avec ces identifiants',
    },
  };
};

const searchPatients = async (req, res) => {
  try {
    const q = `%${(req.query.q || '').trim()}%`;
    if (req.query.q?.trim().length < 2) return success(res, []);

    const [rows] = await pool.execute(`
      SELECT p.id, p.qr_code, p.date_naissance, u.nom, u.prenom, u.email, u.telephone
      FROM patients p JOIN users u ON p.user_id = u.id
      WHERE u.nom LIKE ? OR u.prenom LIKE ? OR u.telephone LIKE ?
         OR u.email LIKE ? OR p.qr_code LIKE ?
         OR CONCAT(u.prenom, ' ', u.nom) LIKE ?
      ORDER BY u.nom, u.prenom
      LIMIT 15
    `, [q, q, q, q, q, q]);
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const consultationExpress = async (req, res) => {
  try {
    const { patient_id, nom, telephone, age, priorite, service, prix } = req.body;
    let patientId = patient_id;
    let credentials = null;
    let patientInfo = null;

    if (!patientId) {
      if (!nom?.trim() || !telephone?.trim()) {
        return error(res, 'Nom et téléphone requis pour un nouveau patient');
      }

      const [byPhone] = await pool.execute(`
        SELECT p.id, u.nom, u.prenom, u.email, u.telephone
        FROM patients p JOIN users u ON p.user_id = u.id
        WHERE u.telephone LIKE ?
        LIMIT 1
      `, [`%${telephone.replace(/\D/g, '').slice(-9)}%`]);

      if (byPhone.length) {
        patientId = byPhone[0].id;
        patientInfo = byPhone[0];
      } else {
        const { prenom, nom: nomFam } = splitFullName(nom);
        const created = await createPatientAccount({
          nom: nomFam,
          prenom,
          telephone,
          date_naissance: age ? ageToBirthDate(age) : null,
        });
        patientId = created.patient_id;
        credentials = created.credentials;
        patientInfo = { id: patientId, prenom, nom: nomFam, telephone, email: credentials.email };
      }
    } else {
      const [rows] = await pool.execute(`
        SELECT p.id, u.nom, u.prenom, u.email, u.telephone
        FROM patients p JOIN users u ON p.user_id = u.id WHERE p.id = ?
      `, [patientId]);
      if (!rows.length) return error(res, 'Patient non trouvé', 404);
      patientInfo = rows[0];
    }

    const numero = await generateNumero();
    const qrCode = `TKT-${patientId}-${numero}`;
    const [ticketResult] = await pool.execute(
      'INSERT INTO tickets (patient_id, numero, qr_code, service, prix, priorite) VALUES (?, ?, ?, ?, ?, ?)',
      [patientId, numero, qrCode, service || 'Consultation générale', prix || 5000, priorite || 'normale']
    );

    return success(res, {
      patient: patientInfo,
      ticket: { id: ticketResult.insertId, numero, qrCode, service: service || 'Consultation générale' },
      credentials,
      nouveau_patient: !!credentials,
    }, credentials ? 'Patient créé et ticket émis' : 'Ticket créé', 201);
  } catch (e) {
    if (e.code === 'DUPLICATE') return error(res, e.message, 409);
    return error(res, e.message, 500);
  }
};

module.exports = { searchPatients, consultationExpress, createPatientAccount, generateEmail, DEFAULT_PASSWORD };
