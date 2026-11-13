import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule } from '../database/prisma.module';
import { ReservasModule } from './reservas.module';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import { UsuarioRepository } from '../usuarios/domain/repositories/usuario.repository';
import { EspacoRepository } from '../espacos/domain/repositories/espaco.repository';
import { InMemoryUsuarioRepository } from '../usuarios/infrastructure/repositories/in-memory-usuario.repository';
import { InMemoryEspacoRepository } from '../espacos/infrastructure/repositories/in-memory-espaco.repository';
import { ReservaRepository } from './domain/repositories/reserva.repository';
import { InMemoryReservaRepository } from './infrastructure/repositories/in-memory-reserva.repository';

describe('API de reservas e isolamento de contas', () => {
  let app: INestApplication;
  let versao: string;

  beforeEach(async () => {
    const pessoas = new InMemoryUsuarioRepository();
    const espacos = new InMemoryEspacoRepository();
    const reservas = new InMemoryReservaRepository();
    for (const contaId of [1, 2]) {
      const pessoa = await pessoas.create({ nome: 'Pessoa cadastrada', contaId });
      const espaco = await espacos.create({ contaId, nome: 'Sala', descricao: 'Sala', capacidade: 4, localizacao: 'Bloco A', valorPorHora: 20 });
      await reservas.create({ contaId, usuarioId: pessoa.id, espacoId: espaco.id, data: '2030-01-10', horarioInicio: '09:00', horarioFim: '10:00' }, contaId);
    }
    versao = (await reservas.findById(1, 1))!.updatedAt;
    const module = await Test.createTestingModule({ imports: [PrismaModule, ReservasModule] })
      .overrideProvider(PrismaService).useValue({})
      .overrideProvider(UsuarioRepository).useValue(pessoas)
      .overrideProvider(EspacoRepository).useValue(espacos)
      .overrideProvider(ReservaRepository).useValue(reservas)
      .overrideProvider(AuthService).useValue({
        authenticate: async (token: string) => {
          if (token === 'kayky') return { id: 1, nome: 'Kayky', papel: 'ADMIN' };
          if (token === 'outra') return { id: 2, nome: 'Outra conta', papel: 'ADMIN' };
          if (token === 'cliente') return { id: 1, nome: 'Acesso limitado', papel: 'CLIENTE' };
          return null;
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterEach(async () => { await app.close(); });

  it('requires an explicit version and rejects stale edits and actions', async () => {
    const server = app.getHttpServer();
    await request(server).patch('/reservas/1').set('Cookie', 'locacao_session=kayky')
      .send({ horarioFim: '11:00' }).expect(400);
    await request(server).post('/reservas/1/acoes').set('Cookie', 'locacao_session=kayky')
      .send({ acao: 'CONFIRMAR', justificativa: 'Teste.' }).expect(400);
    const editada = await request(server).patch('/reservas/1').set('Cookie', 'locacao_session=kayky')
      .send({ updatedAtEsperado: versao, horarioFim: '11:00' }).expect(200);
    expect(editada.body.updatedAt).not.toBe(versao);
    await request(server).patch('/reservas/1').set('Cookie', 'locacao_session=kayky')
      .send({ updatedAtEsperado: versao, horarioFim: '12:00' }).expect(409);
    await request(server).post('/reservas/1/acoes').set('Cookie', 'locacao_session=kayky')
      .send({ updatedAtEsperado: versao, acao: 'CONFIRMAR', justificativa: 'Teste.' }).expect(409);
    const historico = await request(server).get('/reservas/1/historico').set('Cookie', 'locacao_session=kayky').expect(200);
    expect(historico.body).toHaveLength(2);
    expect(historico.body[1]).toMatchObject({ tipoEvento: 'EDICAO', autorId: 1,
      dadosAnteriores: { horarioFim: '10:00' }, dadosNovos: { horarioFim: '11:00' } });
    const semMudanca = await request(server).patch('/reservas/1').set('Cookie', 'locacao_session=kayky')
      .send({ updatedAtEsperado: editada.body.updatedAt, horarioFim: '11:00' }).expect(200);
    expect(semMudanca.body.updatedAt).toBe(editada.body.updatedAt);
    const final = await request(server).get('/reservas/1/historico').set('Cookie', 'locacao_session=kayky').expect(200);
    expect(final.body).toHaveLength(2);
  });

  it('exige sessão para reservas e cadastros', async () => {
    for (const route of ['/reservas', '/usuarios', '/espacos']) {
      await request(app.getHttpServer()).get(route).expect(401);
    }
  });

  it('rejeita status arbitrário e autor forjado', async () => {
    await request(app.getHttpServer()).patch('/reservas/1')
      .set('Cookie', 'locacao_session=kayky').send({ updatedAtEsperado: versao, status: 'CONFIRMADA' }).expect(400);
    await request(app.getHttpServer()).post('/reservas/1/acoes')
      .set('Cookie', 'locacao_session=kayky')
      .send({ updatedAtEsperado: versao, acao: 'CONFIRMAR', justificativa: 'Aprovação.', autorId: 2 }).expect(400);
  });

  it('rejeita campos nulos, datas inexistentes e horários impossíveis', async () => {
    for (const dados of [{ horarioInicio: null }, { horarioFim: '99:99' }, { data: '2026-02-30' }]) {
      await request(app.getHttpServer()).patch('/reservas/1')
        .set('Cookie', 'locacao_session=kayky').send({ ...dados, updatedAtEsperado: versao }).expect(400);
    }
  });

  it('mantém a restrição de ação por papel', async () => {
    await request(app.getHttpServer()).post('/reservas/1/acoes')
      .set('Cookie', 'locacao_session=cliente')
      .send({ updatedAtEsperado: versao, acao: 'CONFIRMAR', justificativa: 'Tentativa.' }).expect(403);
  });

  it('cada conta lista somente suas pessoas, salas e reservas', async () => {
    for (const route of ['/usuarios', '/espacos', '/reservas']) {
      const resposta = await request(app.getHttpServer()).get(route)
        .set('Cookie', 'locacao_session=outra').expect(200);
      expect(resposta.body).toHaveLength(1);
      expect(resposta.body[0].contaId).toBe(2);
    }
  });

  it('protege leitura, edição, exclusão e histórico contra acesso por ID de outra conta', async () => {
    for (const route of ['/usuarios/1', '/espacos/1', '/reservas/1', '/reservas/1/historico']) {
      await request(app.getHttpServer()).get(route).set('Cookie', 'locacao_session=outra').expect(404);
    }
    for (const route of ['/usuarios/1', '/espacos/1']) {
      await request(app.getHttpServer()).patch(route).set('Cookie', 'locacao_session=outra')
        .send({ nome: 'Alterado' }).expect(404);
      await request(app.getHttpServer()).delete(route).set('Cookie', 'locacao_session=outra').expect(404);
    }
    await request(app.getHttpServer()).patch('/reservas/1').set('Cookie', 'locacao_session=outra')
      .send({ updatedAtEsperado: versao, horarioFim: '11:00' }).expect(404);
    await request(app.getHttpServer()).post('/reservas/1/acoes').set('Cookie', 'locacao_session=outra')
      .send({ updatedAtEsperado: versao, acao: 'CANCELAR', justificativa: 'Tentativa.' }).expect(404);
  });

  it('agenda para uma pessoa cadastrada pela conta, distinta da identidade de login', async () => {
    const pessoa = await request(app.getHttpServer()).post('/usuarios')
      .set('Cookie', 'locacao_session=kayky').send({ nome: 'Maria' }).expect(201);
    expect(pessoa.body.id).not.toBe(1);
    const reserva = await request(app.getHttpServer()).post('/reservas')
      .set('Cookie', 'locacao_session=kayky')
      .send({ usuarioId: pessoa.body.id, espacoId: 1, data: '2030-01-11', horarioInicio: '09:00', horarioFim: '10:00' }).expect(201);
    expect(reserva.body).toMatchObject({ usuarioId: pessoa.body.id, contaId: 1 });
    const historico = await request(app.getHttpServer()).get(`/reservas/${reserva.body.id}/historico`)
      .set('Cookie', 'locacao_session=kayky').expect(200);
    expect(historico.body[0].autorId).toBe(1);
    const outraConta = await request(app.getHttpServer()).get('/reservas')
      .set('Cookie', 'locacao_session=outra').expect(200);
    expect(outraConta.body.some((item: { id: number }) => item.id === reserva.body.id)).toBe(false);
  });

  it('rejeita referências a pessoas ou salas de outra conta', async () => {
    for (const dados of [{ usuarioId: 2, espacoId: 1 }, { usuarioId: 1, espacoId: 2 }]) {
      await request(app.getHttpServer()).post('/reservas').set('Cookie', 'locacao_session=kayky')
        .send({ ...dados, data: '2030-01-12', horarioInicio: '09:00', horarioFim: '10:00' }).expect(404);
    }
  });

  it('registra a conta autenticada como autora da mudança de estado', async () => {
    await request(app.getHttpServer()).post('/reservas/1/acoes').set('Cookie', 'locacao_session=kayky')
      .send({ updatedAtEsperado: versao, acao: 'CONFIRMAR', justificativa: 'Aprovação.' }).expect(201);
    const historico = await request(app.getHttpServer()).get('/reservas/1/historico')
      .set('Cookie', 'locacao_session=kayky').expect(200);
    expect(historico.body.at(-1)).toMatchObject({ estadoAnterior: 'PENDENTE', novoEstado: 'CONFIRMADA', autorId: 1 });
  });
});
