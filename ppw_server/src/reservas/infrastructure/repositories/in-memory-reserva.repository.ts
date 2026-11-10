import { Injectable } from '@nestjs/common';
import { Reserva } from '../../domain/entities/reserva.entity';
import { ReservaRepository } from '../../domain/repositories/reserva.repository';

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

  create(data: Omit<Reserva, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Reserva> {
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

  update(id: number, data: Partial<Reserva>): Promise<Reserva | null> {
    const index = this.reservas.findIndex((item) => item.id === id);
    if (index === -1) return Promise.resolve(null);

    const atual = this.reservas[index];
    const atualizada = new Reserva({
      id: atual.id,
      usuarioId: data.usuarioId ?? atual.usuarioId,
      espacoId: data.espacoId ?? atual.espacoId,
      data: data.data ?? atual.data,
      horarioInicio: data.horarioInicio ?? atual.horarioInicio,
      horarioFim: data.horarioFim ?? atual.horarioFim,
      status: data.status ?? atual.status,
      createdAt: atual.createdAt,
      updatedAt: data.updatedAt ?? new Date().toISOString(),
      checkInReal: data.checkInReal ?? atual.checkInReal,
      checkOutReal: data.checkOutReal ?? atual.checkOutReal,
      tempoExcedenteMinutos: data.tempoExcedenteMinutos ?? atual.tempoExcedenteMinutos,
      valorExcedente: data.valorExcedente ?? atual.valorExcedente,
    });

    this.reservas[index] = atualizada;
    return Promise.resolve({ ...atualizada });
  }

  delete(id: number): Promise<boolean> {
    const index = this.reservas.findIndex((item) => item.id === id);
    if (index === -1) return Promise.resolve(false);
    this.reservas.splice(index, 1);
    return Promise.resolve(true);
  }
}
