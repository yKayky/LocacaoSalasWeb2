import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Reserva, StatusReserva } from '../../domain/entities/reserva.entity';
import { ReservaRepository } from '../../domain/repositories/reserva.repository';

@Injectable()
export class ReservaPrismaRepository implements ReservaRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(record: any): Reserva {
    return new Reserva({
      id: record.id,
      usuarioId: record.usuarioId,
      espacoId: record.espacoId,
      data: record.data.toISOString().slice(0, 10),
      horarioInicio: record.horarioInicio,
      horarioFim: record.horarioFim,
      status: record.status as StatusReserva,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      checkInReal: record.checkInReal?.toISOString(),
      checkOutReal: record.checkOutReal?.toISOString(),
      tempoExcedenteMinutos: record.tempoExcedenteMinutos ?? undefined,
      valorExcedente: record.valorExcedente == null ? undefined : Number(record.valorExcedente),
    });
  }

  async findAll(): Promise<Reserva[]> {
    const reservas = await this.prisma.reserva.findMany({ orderBy: { data: 'asc' } });
    return reservas.map((reserva) => this.toEntity(reserva));
  }

  async findById(id: number): Promise<Reserva | null> {
    const reserva = await this.prisma.reserva.findUnique({ where: { id } });
    return reserva ? this.toEntity(reserva) : null;
  }

  async create(data: Omit<Reserva, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Reserva> {
    const reserva = await this.prisma.reserva.create({
      data: {
        usuarioId: data.usuarioId,
        espacoId: data.espacoId,
        data: new Date(`${data.data}T00:00:00.000Z`),
        horarioInicio: data.horarioInicio,
        horarioFim: data.horarioFim,
      },
    });
    return this.toEntity(reserva);
  }

  async update(id: number, data: Partial<Reserva>): Promise<Reserva | null> {
    const updateData: Record<string, unknown> = {};
    if (data.usuarioId !== undefined) updateData.usuarioId = data.usuarioId;
    if (data.espacoId !== undefined) updateData.espacoId = data.espacoId;
    if (data.data !== undefined) updateData.data = new Date(`${data.data}T00:00:00.000Z`);
    if (data.horarioInicio !== undefined) updateData.horarioInicio = data.horarioInicio;
    if (data.horarioFim !== undefined) updateData.horarioFim = data.horarioFim;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.checkInReal !== undefined) updateData.checkInReal = data.checkInReal ? new Date(data.checkInReal) : null;
    if (data.checkOutReal !== undefined) updateData.checkOutReal = data.checkOutReal ? new Date(data.checkOutReal) : null;
    if (data.tempoExcedenteMinutos !== undefined) updateData.tempoExcedenteMinutos = data.tempoExcedenteMinutos;
    if (data.valorExcedente !== undefined) updateData.valorExcedente = data.valorExcedente;

    const result = await this.prisma.reserva.updateMany({ where: { id }, data: updateData as any });
    if (result.count === 0) return null;
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.prisma.reserva.deleteMany({ where: { id } });
    return result.count > 0;
  }
}
