require('dotenv/config');
require('ts-node/register');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { randomBytes } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { Client, Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { ReservaPrismaRepository } = require('../src/reservas/infrastructure/repositories/reserva.prisma.repository');
const { InMemoryReservaRepository } = require('../src/reservas/infrastructure/repositories/in-memory-reserva.repository');
const { verificarContratoReserva } = require('./reserva-repository-contract.cjs');

async function main() {
  const suffix = randomBytes(6).toString('hex');
  const prefix = `v_${suffix}_`;
  const tables = ['contas', 'usuarios', 'espacos', 'reservas', 'historico_reservas', 'credenciais_usuarios', 'sessoes_usuarios'];
  const cacheRoot = path.resolve(__dirname, '../node_modules/.cache');
  const directory = path.join(cacheRoot, `reserva-contract-${suffix}`);
  const generatedClient = path.join(directory, 'client');
  const schemaPath = path.join(directory, 'schema.prisma');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 4, connectionTimeoutMillis: 5000 });
  const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  const table = (name) => `bi3041468."${prefix}${name}"`;
  let connected = false;
  let prisma;
  try {
    await fs.mkdir(directory, { recursive: true });
    let schema = await fs.readFile(path.join(__dirname, '../prisma/schema.prisma'), 'utf8');
    schema = schema.replace('provider = "prisma-client-js"',
      `provider = "prisma-client-js"\n  output = ${JSON.stringify(generatedClient.replaceAll('\\', '/'))}`);
    schema = schema.replace(/@@map\("([^"]+)"\)/g, (_match, name) => `@@map("${prefix}${name}")`);
    await fs.writeFile(schemaPath, schema, 'utf8');
    const prismaCli = path.join(__dirname, '../node_modules/prisma/build/index.js');
    const runPrisma = (args) => execFileSync(process.execPath, [prismaCli, ...args], {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
    runPrisma(['generate', '--schema', schemaPath]);
    let ddl = runPrisma(['migrate', 'diff', '--from-empty', '--to-schema', schemaPath, '--script']);
    ddl = ddl.replace(/CREATE SCHEMA[^;]+;/g, '').replace(/CREATE TYPE[^;]+;/g, '');
    await client.connect();
    connected = true;
    await client.query('SET search_path TO bi3041468');
    await client.query(ddl);
    let constraints = await fs.readFile(path.join(__dirname, '../prisma/constraints.sql'), 'utf8');
    for (const name of tables) constraints = constraints.replace(new RegExp(`\\b${name}\\b`, 'g'), `${prefix}${name}`);
    for (const name of ['proteger_historico_reserva', 'reservas_sem_sobreposicao', 'reservas_um_uso_por_espaco']) {
      constraints = constraints.replaceAll(name, `${prefix}${name}`);
    }
    await client.query(constraints);

    // Only table mappings differ. The application repository runs without mocks.
    const { PrismaClient } = require(generatedClient);
    prisma = new PrismaClient({ adapter: new PrismaPg(pool, { schema: 'bi3041468' }) });
    const conta = await prisma.conta.create({ data: { nome: 'Conta de teste' } });
    const pessoa = await prisma.usuario.create({ data: { nome: 'Pessoa de teste', contaId: conta.id } });
    const sala = await prisma.espaco.create({ data: { nome: 'Sala de teste', capacidade: 4, valorPorHora: 20, contaId: conta.id } });
    const dados = {
      contaId: conta.id, usuarioId: pessoa.id, espacoId: sala.id,
      data: '2030-01-10', horarioInicio: '09:00', horarioFim: '10:00',
    };
    const repository = new ReservaPrismaRepository(prisma);
    await verificarContratoReserva(new InMemoryReservaRepository(), dados, conta.id);
    await verificarContratoReserva(repository, dados, conta.id);

    // Failure to insert the audit record must roll back creation.
    await assert.rejects(() => repository.create({ ...dados, data: '2030-01-20' }, -1));
    assert.equal((await repository.findAll(conta.id)).filter((item) => item.data === '2030-01-20').length, 0);

    // Failure to insert history must also roll back an existing state change.
    const reserva = await repository.create({ ...dados, data: '2030-01-21' }, conta.id);
    await assert.rejects(() => repository.transitionStatus(reserva.id, 'PENDENTE', 'CONFIRMADA', {
      contaId: conta.id, autorId: -1, updatedAtEsperado: reserva.updatedAt, justificativa: 'Falha de auditoria.',
    }));
    const aposFalha = await repository.findById(reserva.id, conta.id);
    assert.equal(aposFalha.status, 'PENDENTE');
    assert.equal(aposFalha.updatedAt, reserva.updatedAt);
    assert.equal((await repository.findHistory(reserva.id, conta.id)).length, 1);

    // The database also protects direct writes outside the repository.
    await assert.rejects(() => prisma.reserva.create({ data: { ...dados, data: new Date('2030-01-10T00:00:00Z') } }));
    const primeiroUso = await prisma.reserva.create({ data: {
      ...dados, data: new Date('2030-01-30T00:00:00Z'), status: 'EM_ANDAMENTO',
    } });
    await assert.rejects(() => prisma.reserva.create({ data: {
      ...dados, data: new Date('2030-01-31T00:00:00Z'), status: 'EM_ANDAMENTO',
    } }));
    await prisma.reserva.update({ where: { id: primeiroUso.id }, data: { status: 'FINALIZADA' } });
    const historico = (await repository.findHistory(reserva.id, conta.id))[0];
    await assert.rejects(() => prisma.historicoReserva.delete({ where: { idRegistro: historico.idRegistro } }));
    await assert.rejects(() => prisma.conta.delete({ where: { id: conta.id } }));
    const outraConta = await prisma.conta.create({ data: { nome: 'Outra conta' } });
    await assert.rejects(() => prisma.reserva.create({ data: {
      ...dados, contaId: outraConta.id, data: new Date('2030-02-01T00:00:00Z'),
    } }));
    console.log('Contrato compartilhado aprovado em memória e no ReservaPrismaRepository real.');
    console.log('PostgreSQL aprovado: concorrência, ocupação exclusiva, rollback de criação/transição, isolamento e auditoria imutável.');
  } finally {
    if (prisma) await prisma.$disconnect();
    await pool.end();
    if (connected) {
      assert.match(prefix, /^v_[a-f0-9]{12}_$/);
      await client.query(`DROP TABLE IF EXISTS ${tables.map(table).join(', ')} CASCADE`);
      await client.query(`DROP FUNCTION IF EXISTS bi3041468."${prefix}proteger_historico_reserva"()`);
    }
    await client.end().catch(() => {});
    assert.equal(path.dirname(directory), cacheRoot);
    assert.match(path.basename(directory), /^reserva-contract-[a-f0-9]{12}$/);
    await fs.rm(directory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error('Verificação PostgreSQL falhou:', error.code || error.name);
  if (error.stderr) console.error(String(error.stderr).slice(0, 2500));
  else if (error.name === 'Error') console.error(String(error.message).slice(0, 1500));
  if (error.code === 'ERR_ASSERTION') console.error(error.message);
  process.exitCode = 1;
});
