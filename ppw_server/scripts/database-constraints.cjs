require('dotenv/config');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    if (process.argv.includes('--check')) {
      const result = await client.query(
        'SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name',
        ['bi3041468'],
      );
      console.log('Tabelas encontradas:', result.rows.map((row) => row.table_name).join(', '));
      return;
    }
    const sql = await readFile(path.join(__dirname, '../prisma/constraints.sql'), 'utf8');
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '10s'");
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Constraints e proteção do histórico aplicadas.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Falha ao preparar constraints. Código:', error.code || error.name);
    console.error('Confira a conexão, permissões e possíveis dados antigos incompatíveis.');
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

void main();
