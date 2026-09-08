require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, '../database/migration_v8_certificats_lits_assurances.sql'), 'utf8');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  try {
    await conn.query(sql);
    console.log('✓ Migration v8 (certificats, lits, assurances) appliquée avec succès');
  } catch (e) {
    console.error('Migration échouée:', e.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

migrate();
