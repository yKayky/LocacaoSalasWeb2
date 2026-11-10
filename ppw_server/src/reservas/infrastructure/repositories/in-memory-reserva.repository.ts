import { ConflictException, Injectable } from '@nestjs/common';
import { Reserva } from '../../domain/entities/reserva.entity';
import { ReservaHistorico, ReservaRepository, TransicaoAuditoria } from '../../domain/repositories/reserva.repository';
import { StatusReserva } from '../../domain/entities/reserva.entity';

@Injectable()
export class InMemoryReservaRepository implements ReservaRepository {
  private reservas: Reserva[] = [
    new Reserva({
      id: 1,
      usuarioId: 1,
      espacoId: 1,
      data: '2026-09-20',
      horarioInicio: '08:00',
      horarioFim: '09:00',
      status: 'CONFIRMADA',
      createdAt: '2026-09-18T10:00:00.000Z',
      updatedAt: '2026-09-18T10:00:00.000Z',
    }),
    new Reserva({
      id: 2,
      usuarioId: 2,
      espacoId: 2,
      data: '2026-10-15',
      horarioInicio: '14:00',
      horarioFim: '16:00',
      status: 'PENDENTE',
      createdAt: '2026-10-10T14:30:00.000Z',
      updatedAt: '2026-10-10T14:30:00.000Z',
    }),
  ];

  findAll(): Promise<Reserva[]> {
    return Promise.resolve([...this.reservas]);
  }

  findById(id: number): Promise<Reserva | null> {
    const reserva = this.reservas.find((item) => item.id === id);
    return Promise.resolve(reserva ? { ...reserva } : null);
  }

  findHistory(_id: number): ReservaHistorico[] {
    return [];
  }

  create(
    data: Omit<Reserva, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
    _autorId: number,
  ): Promise<Reserva> {
    const id = this.reservas.reduce((maior, item) => Math.max(maior, item.id), 0) + 1;
    const agora = new Date().toISOString();
    const nova = new Reserva({
      id,
      ...data,
      status: 'PENDENTE',
      createdAt: agora,
      updatedAt: agora,
    });
    this.reservas.push(nova);
    return Promise.resolve({ ...nova });
  }

  update(id: number, data: Partial<Reserva>, updatedAtEsperado: string): Promise<Reserva | null> {
    const index = this.reservas.findIndex((item) => item.id === id);
    if (index === -1) return Promise.resolve(null);

    const atual = this.reservas[index];
    if (atual.status !== 'PENDENTE' || atual.updatedAt !== updatedAtEsperado) {
      throw new ConflictException('A reserva foi alterada. Atualize a página antes de editar.');
    }
    const atualizada = new Reserva({
      id: atual.id,
      usuarioId: data.usuarioId ?? atual.usuarioId,
      espacoId: data.espacoId ?? atual.espacoId,
      data: data.data ?? atual.data,
      horarioInicio: data.horarioInicio ?? atual.horarioInicio,
      horarioFim: data.horarioFim ?? atual.horarioFim,
      status: atual.status,
      createdAt: atual.createdAt,
      updatedAt: new Date(Math.max(Date.now(), Date.parse(atual.updatedAt) + 1)).toISOString(),
      checkInReal: data.checkInReal ?? atual.checkInReal,
      checkOutReal: data.checkOutReal ?? atual.checkOutReal,
      tempoExcedenteMinutos: data.tempoExcedenteMinutos ?? atual.tempoExcedenteMinutos,
      valorExcedente: data.valorExcedente ?? atual.valorExcedente,
    });

    this.reservas[index] = atualizada;
    return Promise.resolve({ ...atualizada });
  }

  async transitionStatus(
    id: number,
    estadoEsperado: StatusReserva,
    novoEstado: StatusReserva,
    auditoria: TransicaoAuditoria,
  ): Promise<Reserva | null> {
    const atual = this.reservas.find((item) => item.id === id);
    if (!atual || atual.status !== estadoEsperado) return null;
    if (atual.updatedAt !== auditoria.updatedAtEsperado) {
      throw new ConflictException('A reserva foi alterada. Atualize a página antes de executar a ação.');
    }
    atual.status = novoEstado;
    atual.updatedAt = new Date(Math.max(Date.now(), Date.parse(atual.updatedAt) + 1)).toISOString();
    if (auditoria.checkInReal) atual.checkInReal = auditoria.checkInReal;
    if (auditoria.checkOutReal) atual.checkOutReal = auditoria.checkOutReal;
    return { ...atual };
  }

  delete(_id: number): Promise<boolean> {
    throw new ConflictException('Reservas não podem ser excluídas; use a ação CANCELAR para preservar o histórico.');
  }
}
