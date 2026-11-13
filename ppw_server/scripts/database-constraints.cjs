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
      const tables = result.rows.map((row) => row.table_name);
      const requiredTables = ['contas', 'usuarios', 'espacos', 'reservas', 'historico_reservas', 'credenciais_usuarios', 'sessoes_usuarios'];
      const constraints = await client.query("SELECT pc.conname FROM pg_constraint pc JOIN pg_class c ON c.oid = pc.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = $1 AND c.relname IN ('reservas', 'espacos', 'historico_reservas')", ['bi3041468']);
      const sql = await readFile(path.join(__dirname, '../prisma/constraints.sql'), 'utf8');
      const requiredConstraints = [...sql.matchAll(/\('(?:reservas|espacos|historico_reservas)', '([^']+)'/g)].map((match) => match[1]);
      requiredConstraints.push('reservas_sem_sobreposicao');
      const indexes = await client.query("SELECT indexname FROM pg_indexes WHERE schemaname = $1", ['bi3041468']);
      const triggers = await client.query("SELECT t.tgname FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = $1 AND c.relname IN ('reservas', 'historico_reservas') AND NOT t.tgisinternal AND t.tgenabled <> 'D'", ['bi3041468']);
      const columns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'historico_reservas'", ['bi3041468']);
      const missing = [
        ...requiredTables.filter((name) => !tables.includes(name)),
        ...requiredConstraints.filter((name) => !constraints.rows.some((row) => row.conname === name)),
        ...['reservas_um_uso_por_espaco'].filter((name) => !indexes.rows.some((row) => row.indexname === name)),
        ...['historico_reservas_imutavel', 'reservas_estado_valido'].filter((name) => !triggers.rows.some((row) => row.tgname === name)),
        ...['tipo_evento', 'dados_anteriores', 'dados_novos'].filter((name) => !columns.rows.some((row) => row.column_name === name)),
      ];
      if (missing.length) throw Object.assign(new Error('Estrutura incompleta'), { code: 'INCOMPLETE_SCHEMA', missing });
      console.log('Tabelas, auditoria, constraints, indice de ocupacao e triggers verificados.');
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
    if (error.missing) console.error('Ausentes:', error.missing.join(', '));
    console.error('Confira a conexão, permissões e possíveis dados antigos incompatíveis.');
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

void main();
