const pool = require('../config/database');
const { success, error } = require('../utils/response');
const { createNotification } = require('../utils/notifications');
const billingService = require('../services/billingService');
const path = require('path');
const fs = require('fs');

const create = async (req, res) => {
  try {
    const { patient_id, type_analyse } = req.body;
    const [med] = await pool.execute('SELECT id FROM medecins WHERE user_id = ?', [req.user.id]);
    const [result] = await pool.execute(
      'INSERT INTO analyses (patient_id, medecin_id, type_analyse) VALUES (?, ?, ?)',
      [patient_id, med[0]?.id, type_analyse]
    );

    const [patUser] = await pool.execute('SELECT user_id FROM patients WHERE id = ?', [patient_id]);
    if (patUser[0]) {
      await createNotification(patUser[0].user_id, 'Analyse demandée', `Analyse: ${type_analyse}`, 'analyse');
    }

    await billingService.facturerAnalyse(result.insertId, patient_id, type_analyse);

    return success(res, { id: result.insertId }, 'Analyse demandée', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getAll = async (req, res) => {
  try {
    let query = `
      SELECT a.*, pu.nom as patient_nom, pu.prenom as patient_prenom,
             mu.nom as medecin_nom, mu.prenom as medecin_prenom
      FROM analyses a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      LEFT JOIN medecins m ON a.medecin_id = m.id
      LEFT JOIN users mu ON m.user_id = mu.id
    `;
    const params = [];

    if (req.user.role === 'patient') {
      const [pat] = await pool.execute('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
      query += ' WHERE a.patient_id = ?';
      params.push(pat[0]?.id);
    } else if (req.user.role === 'laborantin') {
      query += " WHERE a.statut IN ('demande','en_cours')";
    }

    query += ' ORDER BY a.date_demande DESC';
    const [rows] = await pool.execute(query, params);
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const update = async (req, res) => {
  try {
    const { statut, resultat_texte, resultat_url } = req.body;
    await pool.execute(
      `UPDATE analyses SET statut=COALESCE(?,statut), resultat_texte=COALESCE(?,resultat_texte),
       resultat_url=COALESCE(?,resultat_url), date_resultat=IF(?='termine',NOW(),date_resultat)
       WHERE id = ?`,
      [statut, resultat_texte, resultat_url, statut, req.params.id]
    );

    if (statut === 'termine') {
      const [a] = await pool.execute('SELECT patient_id, type_analyse FROM analyses WHERE id = ?', [req.params.id]);
      if (a[0]) {
        const [pu] = await pool.execute('SELECT user_id FROM patients WHERE id = ?', [a[0].patient_id]);
        if (pu[0]) {
          await createNotification(
            pu[0].user_id,
            'Résultats disponibles',
            `Résultats de ${a[0].type_analyse} sont prêts`,
            'analyse'
          );
        }
      }
    }

    const [rows] = await pool.execute('SELECT * FROM analyses WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Analyse mise à jour');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const uploadResult = async (req, res) => {
  try {
    if (!req.file) return error(res, 'Fichier requis (PDF ou image)');
    const resultat_url = `/uploads/${req.file.filename}`;
    await pool.execute(
      "UPDATE analyses SET resultat_url = ?, statut = 'termine', date_resultat = NOW() WHERE id = ?",
      [resultat_url, req.params.id]
    );

    const [a] = await pool.execute('SELECT patient_id, type_analyse FROM analyses WHERE id = ?', [req.params.id]);
    if (a[0]) {
      const [pu] = await pool.execute('SELECT user_id FROM patients WHERE id = ?', [a[0].patient_id]);
      if (pu[0]) {
        await createNotification(
          pu[0].user_id,
          'Résultats disponibles',
          `Résultats de ${a[0].type_analyse} sont prêts (document joint)`,
          'analyse'
        );
      }
    }

    const [rows] = await pool.execute('SELECT * FROM analyses WHERE id = ?', [req.params.id]);
    return success(res, rows[0], 'Résultat importé');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { create, getAll, update, uploadResult };
