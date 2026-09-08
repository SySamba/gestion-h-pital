require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, '../database/migration_v9_indexes.sql'), 'utf8');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  try {
    await conn.query(sql);
    const [rows] = await conn.query(
      "SELECT COUNT(DISTINCT index_name) AS total FROM information_schema.statistics WHERE table_schema = DATABASE() AND index_name LIKE 'idx_%'"
    );
    console.log(`✓ Migration v9 (index de performance) appliquée — ${rows[0].total} index idx_* en base`);
  } catch (e) {
    console.error('Migration échouée:', e.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

migrate();
