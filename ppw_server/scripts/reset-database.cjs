require('dotenv/config');
const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  const nomes = ['historico_reservas', 'reservas', 'sessoes_usuarios', 'credenciais_usuarios', 'espacos', 'usuarios', 'contas'];
  try {
    await client.connect();
    const existentes = await client.query(
      'SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_name=ANY($2::text[])',
      ['bi3041468', nomes],
    );
    const tabelas = existentes.rows.map((row) => row.table_name);
    if (tabelas.length === 0) throw new Error('Tabelas do projeto não encontradas.');
    await client.query('BEGIN');
    // Enumerate all project tables together so referential integrity is preserved.
    // No CASCADE is used, so references from other applications stop the reset.
    await client.query(`TRUNCATE TABLE ${tabelas.map((nome) => `bi3041468."${nome}"`).join(', ')} RESTART IDENTITY`);
    await client.query('COMMIT');
    console.log('Dados removidos das tabelas do projeto. Contas e cadastros devem ser criados novamente.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Falha ao esvaziar o banco:', error.code || error.name);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

void main();
