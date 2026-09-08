const pool = require('../config/database');
const { success, error } = require('../utils/response');
const XLSX = require('xlsx');

const getMedicaments = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM medicaments ORDER BY nom');
    const withAlert = rows.map((m) => ({ ...m, alerte_stock: m.stock <= m.seuil_alerte }));
    return success(res, withAlert);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const createMedicament = async (req, res) => {
  try {
    const { nom, description, stock, prix, seuil_alerte } = req.body;
    if (!nom?.trim()) return error(res, 'Le nom du médicament est requis', 400);
    const [result] = await pool.execute(
      'INSERT INTO medicaments (nom, description, stock, prix, seuil_alerte) VALUES (?, ?, ?, ?, ?)',
      [nom.trim(), description || null, stock || 0, prix || 0, seuil_alerte || 10]
    );
    return success(res, { id: result.insertId }, 'Médicament ajouté', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const updateMedicament = async (req, res) => {
  try {
    const { nom, description, stock, prix, seuil_alerte } = req.body;
    await pool.execute(
      `UPDATE medicaments SET nom=COALESCE(?,nom), description=COALESCE(?,description),
       stock=COALESCE(?,stock), prix=COALESCE(?,prix), seuil_alerte=COALESCE(?,seuil_alerte) WHERE id = ?`,
      [nom, description, stock, prix, seuil_alerte, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM medicaments WHERE id = ?', [req.params.id]);
    if (!rows.length) return error(res, 'Médicament non trouvé', 404);
    return success(res, rows[0], 'Médicament mis à jour');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const deleteMedicament = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id FROM medicaments WHERE id = ?', [req.params.id]);
    if (!rows.length) return error(res, 'Médicament non trouvé', 404);
    await pool.execute('DELETE FROM medicaments WHERE id = ?', [req.params.id]);
    return success(res, { id: req.params.id }, 'Médicament supprimé');
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2') {
      return error(res, 'Ce médicament est lié à des ventes et ne peut pas être supprimé', 400);
    }
    return error(res, e.message, 500);
  }
};

const adjustStock = async (req, res) => {
  try {
    const { adjustment, new_stock } = req.body;
    const [rows] = await pool.execute('SELECT * FROM medicaments WHERE id = ?', [req.params.id]);
    if (!rows.length) return error(res, 'Médicament non trouvé', 404);

    let finalStock;
    if (typeof new_stock === 'number') {
      finalStock = new_stock;
    } else if (typeof adjustment === 'number') {
      finalStock = rows[0].stock + adjustment;
    } else {
      return error(res, 'Fournissez adjustment (delta) ou new_stock (valeur absolue)', 400);
    }

    if (finalStock < 0) finalStock = 0;

    await pool.execute('UPDATE medicaments SET stock = ? WHERE id = ?', [finalStock, req.params.id]);
    return success(res, { id: req.params.id, stock: finalStock }, 'Stock ajusté');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const importMedicaments = async (req, res) => {
  try {
    if (!req.file) return error(res, 'Aucun fichier fourni', 400);

    const wb = XLSX.readFile(req.file.path);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws);

    if (!rows.length) return error(res, 'Le fichier ne contient aucune donnée', 400);

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const nom = (r.nom || r.Nom || r.NOM || '').toString().trim();
      if (!nom) { skipped++; errors.push(`Ligne ${i + 2}: nom manquant`); continue; }

      const description = (r.description || r.Description || '').toString().trim() || null;
      const stock = parseInt(r.stock || r.Stock || r.quantite || r.Quantite || 0, 10) || 0;
      const prix = parseFloat(r.prix || r.Prix || 0) || 0;
      const seuil = parseInt(r.seuil_alerte || r.Seuil || r.seuil || 10, 10) || 10;

      try {
        await pool.execute(
          'INSERT INTO medicaments (nom, description, stock, prix, seuil_alerte) VALUES (?, ?, ?, ?, ?)',
          [nom, description, stock, prix, seuil]
        );
        imported++;
      } catch (e2) {
        skipped++;
        errors.push(`Ligne ${i + 2}: ${e2.message}`);
      }
    }

    const fs = require('fs');
    fs.unlink(req.file.path, () => {});

    return success(res, { imported, skipped, errors }, `${imported} médicament(s) importé(s), ${skipped} ignoré(s)`);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const downloadTemplate = async (req, res) => {
  try {
    const data = [
      { nom: 'Paracétamol 500mg', description: 'Antalgique', stock: 500, prix: 250, seuil_alerte: 50 },
      { nom: 'Amoxicilline 1g', description: 'Antibiotique', stock: 200, prix: 1500, seuil_alerte: 30 },
      { nom: 'Ibuprofène 400mg', description: 'Anti-inflammatoire', stock: 150, prix: 800, seuil_alerte: 20 },
      { nom: 'Artéméther-Luméfantrine', description: 'Antipaludéen', stock: 120, prix: 3500, seuil_alerte: 25 },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Médicaments');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=modele_medicaments.xlsx');
    return res.send(buf);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const createVente = async (req, res) => {
  try {
    const { ordonnance_id, medicament_id, quantite } = req.body;
    const [med] = await pool.execute('SELECT * FROM medicaments WHERE id = ?', [medicament_id]);
    if (!med.length) return error(res, 'Médicament non trouvé', 404);
    if (med[0].stock < quantite) return error(res, 'Stock insuffisant', 400);

    const prixTotal = med[0].prix * quantite;
    const [result] = await pool.execute(
      'INSERT INTO ventes (ordonnance_id, medicament_id, pharmacien_id, quantite, prix_unitaire, prix_total) VALUES (?, ?, ?, ?, ?, ?)',
      [ordonnance_id, medicament_id, req.user.id, quantite, med[0].prix, prixTotal]
    );
    await pool.execute('UPDATE medicaments SET stock = stock - ? WHERE id = ?', [quantite, medicament_id]);

    if (ordonnance_id) {
      await pool.execute("UPDATE ordonnances SET statut = 'delivree' WHERE id = ?", [ordonnance_id]);
    }
    return success(res, { id: result.insertId, prix_total: prixTotal }, 'Vente enregistrée', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getVentes = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT v.*, m.nom as medicament_nom, u.nom as pharmacien_nom
      FROM ventes v
      JOIN medicaments m ON v.medicament_id = m.id
      LEFT JOIN users u ON v.pharmacien_id = u.id
      ORDER BY v.date_vente DESC LIMIT 100
    `);
    return success(res, rows);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = {
  getMedicaments,
  createMedicament,
  updateMedicament,
  deleteMedicament,
  adjustStock,
  importMedicaments,
  downloadTemplate,
  createVente,
  getVentes,
};
