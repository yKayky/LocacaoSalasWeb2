import { ReservaPrismaRepository } from './reserva.prisma.repository';
import { PrismaService } from '../../../database/prisma.service';

describe('Transacao de reservas', () => {
  const registro = { id: 1, contaId: 1, usuarioId: 1, espacoId: 1,
    data: new Date('2030-01-01'), horarioInicio: '09:00', horarioFim: '10:00',
    status: 'CONFIRMADA', createdAt: new Date(), updatedAt: new Date(),
    checkInReal: null, checkOutReal: null };
  it('classifies legacy history without rewriting immutable rows', async () => {
    const rows = [
      { tipoEvento: null, estadoAnterior: null, dadosAnteriores: null, dadosNovos: null },
      { tipoEvento: null, estadoAnterior: 'PENDENTE', dadosAnteriores: null, dadosNovos: null },
    ];
    const prisma = { historicoReserva: { findMany: jest.fn().mockResolvedValue(rows) } };
    const repository = new ReservaPrismaRepository(prisma as unknown as PrismaService);
    expect((await repository.findHistory(1, 1)).map((row) => row.tipoEvento)).toEqual(['CRIACAO', 'TRANSICAO']);
    expect(rows.every((row) => row.tipoEvento === null)).toBe(true);
  });

  it('revalidates guards after acquiring both locks and never writes on failure', async () => {
    const lock = jest.fn().mockResolvedValue([]);
    const updateMany = jest.fn();
    const create = jest.fn();
    const tx = { $queryRaw: lock, reserva: { findFirst: jest.fn().mockResolvedValueOnce(registro).mockResolvedValueOnce(null), updateMany }, historicoReserva: { create } };
    const prisma = { $transaction: (callback: (tx: unknown) => unknown) => callback(tx) };
    const repository = new ReservaPrismaRepository(prisma as unknown as PrismaService);
    await expect(repository.transitionStatus(1, 'CONFIRMADA', 'EM_ANDAMENTO', {
      contaId: 1, autorId: 1, updatedAtEsperado: registro.updatedAt.toISOString(), justificativa: 'Chegada.',
      validarSobLock() { expect(lock).toHaveBeenCalledTimes(2); throw new Error('Periodo encerrado durante a espera.'); },
    })).rejects.toThrow('Periodo encerrado');
    expect(updateMany).not.toHaveBeenCalled(); expect(create).not.toHaveBeenCalled();
  });
});
