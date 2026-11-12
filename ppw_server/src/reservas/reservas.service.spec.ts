import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InMemoryEspacoRepository } from '../espacos/infrastructure/repositories/in-memory-espaco.repository';
import { InMemoryUsuarioRepository } from '../usuarios/infrastructure/repositories/in-memory-usuario.repository';
import { CreateReservaUseCase } from './application/use-cases/create-reserva.use-case';
import { TransicionarReservaUseCase } from './application/use-cases/transicionar-reserva.use-case';
import { UpdateReservaUseCase } from './application/use-cases/update-reserva.use-case';
import { InMemoryReservaRepository } from './infrastructure/repositories/in-memory-reserva.repository';
import type { AuthenticatedUser } from '../auth/authenticated-user';
import { GuardaReservaViolada } from './domain/entities/reserva-guardas';

describe('Regras de reservas', () => {
  let repository: InMemoryReservaRepository;
  let criar: CreateReservaUseCase;
  let editar: UpdateReservaUseCase;
  let transicionar: TransicionarReservaUseCase;
  const operador: AuthenticatedUser = { id: 3, nome: 'Operador', papel: 'OPERADOR' };
  const cliente: AuthenticatedUser = { id: 3, nome: 'Cliente', papel: 'CLIENTE' };
  const dados = {
    usuarioId: 1, espacoId: 1, data: '2026-10-01', horarioInicio: '09:00', horarioFim: '10:00',
  };

  beforeEach(async () => {
    repository = new InMemoryReservaRepository();
    const usuarios = new InMemoryUsuarioRepository();
    const espacos = new InMemoryEspacoRepository();
    await usuarios.create({ nome: 'Pessoa da conta 3', contaId: 3 });
    await usuarios.create({ nome: 'Pessoa da conta 1', contaId: 1 });
    for (const contaId of [3, 1]) {
      await espacos.create({ contaId, nome: 'Sala', descricao: 'Sala', capacidade: 4, localizacao: 'Bloco A', valorPorHora: 20 });
    }
    criar = new CreateReservaUseCase(repository, usuarios, espacos);
    editar = new UpdateReservaUseCase(repository, usuarios, espacos);
    transicionar = new TransicionarReservaUseCase(repository);
    await repository.create({ ...dados, contaId: 3, data: '2026-09-20', horarioInicio: '08:00', horarioFim: '09:00' }, 3);
    await transicionar.execute(1, 'CONFIRMAR', 'Inicialização.', operador);
    await repository.create({ ...dados, contaId: 3, data: '2026-10-15' }, 3);
  });

  it('cria uma reserva com status PENDENTE', async () => {
    const reserva = await criar.execute(dados, operador);
    expect(reserva.status).toBe('PENDENTE');
    expect(repository.findHistory(reserva.id, 3)[0]).toMatchObject({
      estadoAnterior: null, novoEstado: 'PENDENTE', autorId: operador.id,
    });
  });

  it('rejeita horário ocupado para o mesmo espaço', async () => {
    await expect(
      criar.execute({
        usuarioId: 1,
        espacoId: 1,
        data: '2026-09-20',
        horarioInicio: '08:00',
        horarioFim: '09:00',
      }, operador),
    ).rejects.toThrow('O espaço já possui uma reserva conflitante neste horário.');
  });

  it('aceita uma transição válida', async () => {
    const atualizada = await transicionar.execute(2, 'CONFIRMAR', 'Reserva aprovada.', operador);
    expect(atualizada.status).toBe('CONFIRMADA');
    expect(repository.findHistory(2, 3).at(-1)).toMatchObject({
      estadoAnterior: 'PENDENTE', novoEstado: 'CONFIRMADA', autorId: operador.id,
    });
  });

  it('rejeita uma transição inválida', async () => {
    await expect(transicionar.execute(1, 'FINALIZAR', 'Encerramento.', operador))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findHistory(1, 3)).toHaveLength(2);
  });

  it('respeita o papel e impede acesso a outra conta', async () => {
    await expect(transicionar.execute(2, 'CONFIRMAR', 'Solicitação.', cliente))
      .rejects.toBeInstanceOf(ForbiddenException);
    await expect(transicionar.execute(2, 'CANCELAR', 'Solicitação.', { ...cliente, id: 1 }))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it('libera o horário após cancelamento e preserva a auditoria', async () => {
    const reserva = await criar.execute(dados, cliente);
    await transicionar.execute(reserva.id, 'CANCELAR', 'Mudança de planos.', cliente);
    await expect(criar.execute(dados, cliente)).resolves.toMatchObject({ status: 'PENDENTE' });
    expect(repository.findHistory(reserva.id, 3)).toHaveLength(2);
  });

  it('permite somente uma criação concorrente no mesmo horário', async () => {
    const resultados = await Promise.allSettled([
      criar.execute(dados, operador), criar.execute(dados, operador),
    ]);
    expect(resultados.filter((item) => item.status === 'fulfilled')).toHaveLength(1);
    expect(resultados.filter((item) => item.status === 'rejected')).toHaveLength(1);
  });

  it('aceita reservas adjacentes sem sobreposição', async () => {
    await criar.execute(dados, operador);
    await expect(criar.execute({ ...dados, horarioInicio: '10:00', horarioFim: '11:00' }, operador))
      .resolves.toMatchObject({ horarioInicio: '10:00' });
  });

  it('rejeita edição validada sobre uma versão anterior da reserva', async () => {
    const reserva = await criar.execute(dados, operador);
    await transicionar.execute(reserva.id, 'CONFIRMAR', 'Confirmação.', operador);
    await expect(async () => repository.update(reserva.id, { horarioFim: '11:00' }, reserva.updatedAt, 3))
      .rejects.toBeInstanceOf(ConflictException);
  });

  it('não permite editar reserva confirmada', async () => {
    await expect(editar.execute(1, { horarioFim: '11:00' }, operador))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita check-in antes do início no fuso de Brasília', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-01T11:59:59Z'));
    try {
      const reserva = await criar.execute(dados, operador);
      await transicionar.execute(reserva.id, 'CONFIRMAR', 'Confirmada.', operador);
      await expect(transicionar.execute(reserva.id, 'INICIAR', 'Chegada.', operador))
        .rejects.toBeInstanceOf(BadRequestException);
    } finally {
      jest.useRealTimers();
    }
  });

  it('impede mutações externas nos dados retornados pelo repositório', async () => {
    const reservas = await repository.findAll(3);
    reservas[0].status = 'CANCELADA';
    expect((await repository.findById(reservas[0].id, 3))?.status).toBe('CONFIRMADA');
  });

  it('rejeita check-in a partir do fim do período reservado', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-01T13:00:00Z'));
    try {
      const reserva = await criar.execute(dados, operador);
      await transicionar.execute(reserva.id, 'CONFIRMAR', 'Confirmada.', operador);
      await expect(transicionar.execute(reserva.id, 'INICIAR', 'Chegada.', operador))
        .rejects.toBeInstanceOf(BadRequestException);
      expect((await repository.findById(reserva.id, 3))?.status).toBe('CONFIRMADA');
      expect(repository.findHistory(reserva.id, 3)).toHaveLength(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it('permite adicionar uma guarda sem alterar a execução da transição', async () => {
    const comGuardaAdicional = new TransicionarReservaUseCase(repository, [{
      acao: 'CONFIRMAR',
      validar() { throw new GuardaReservaViolada('Regra adicional de aprovação.'); },
    }]);
    await expect(comGuardaAdicional.execute(2, 'CONFIRMAR', 'Aprovação.', operador))
      .rejects.toThrow('Regra adicional de aprovação.');
    expect((await repository.findById(2, 3))?.status).toBe('PENDENTE');
  });
});
