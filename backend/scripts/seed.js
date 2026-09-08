require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function seed() {
  const sqlPath = path.join(__dirname, '../database/seed_senegal.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('Insertion des données sénégalaises...');
  await connection.query(sql);
  await connection.end();
  console.log('Données insérées avec succès.');
  console.log('\nComptes (mot de passe: password123):');
  console.log('  admin@hopital.sn       — Administrateur');
  console.log('  dr.ndiaye@hopital.sn   — Médecin');
  console.log('  fatou.fall@hopital.sn  — Patient');
  console.log('  reception@hopital.sn   — Réception');
  console.log('  labo@hopital.sn        — Laboratoire');
  console.log('  pharma@hopital.sn      — Pharmacie');
}

seed().catch((err) => {
  console.error('Erreur seed:', err.message);
  process.exit(1);
});
