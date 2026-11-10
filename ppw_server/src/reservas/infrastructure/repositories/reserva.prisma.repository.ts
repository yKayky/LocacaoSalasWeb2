import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { Reserva, StatusReserva } from '../../domain/entities/reserva.entity';
import { ReservaHistorico, ReservaRepository, TransicaoAuditoria } from '../../domain/repositories/reserva.repository';

@Injectable()
export class ReservaPrismaRepository implements ReservaRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async lockSlot(
    tx: Prisma.TransactionClient,
    espacoId: number,
    data: string,
  ): Promise<void> {
    const dia = new Date(`${data}T00:00:00.000Z`).getTime() / 86_400_000;
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(${espacoId}, ${dia})`;
  }

  private async ensureSlotAvailable(
    tx: Prisma.TransactionClient,
    slot: { espacoId: number; data: string; inicio: string; fim: string },
    ignoredId?: number,
  ): Promise<void> {
    const conflito = await tx.reserva.findFirst({
      where: {
        espacoId: slot.espacoId,
        data: new Date(`${slot.data}T00:00:00.000Z`),
        status: { notIn: ['CANCELADA', 'FINALIZADA'] },
        horarioInicio: { lt: slot.fim },
        horarioFim: { gt: slot.inicio },
        ...(ignoredId === undefined ? {} : { id: { not: ignoredId } }),
      },
    });
    if (conflito) {
      throw new ConflictException('O espaço já possui uma reserva conflitante neste horário.');
    }
  }

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

  async findHistory(id: number): Promise<ReservaHistorico[]> {
    return this.prisma.historicoReserva.findMany({
      where: { reservaId: id },
      include: { autor: { select: { id: true, nome: true } } },
      orderBy: { timestamp: 'asc' },
    });
  }

  async create(data: Omit<Reserva, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Reserva> {
    const reserva = await this.prisma.$transaction(async (tx) => {
      await this.lockSlot(tx, data.espacoId, data.data);
      await this.ensureSlotAvailable(tx, {
        espacoId: data.espacoId,
        data: data.data,
        inicio: data.horarioInicio,
        fim: data.horarioFim,
      });
      const criada = await tx.reserva.create({
        data: {
          usuarioId: data.usuarioId,
          espacoId: data.espacoId,
          data: new Date(`${data.data}T00:00:00.000Z`),
          horarioInicio: data.horarioInicio,
          horarioFim: data.horarioFim,
        },
      });
      await tx.historicoReserva.create({
        data: {
          reservaId: criada.id,
          estadoAnterior: null,
          novoEstado: 'PENDENTE',
          justificativa: 'Reserva criada.',
        },
      });
      return criada;
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

    const reserva = await this.prisma.$transaction(async (tx) => {
      const atual = await tx.reserva.findUnique({ where: { id } });
      if (!atual) return null;

      const slotAnterior = {
        espacoId: atual.espacoId,
        data: atual.data.toISOString().slice(0, 10),
      };
      const slotNovo = {
        espacoId: (data.espacoId ?? atual.espacoId),
        data: data.data ?? slotAnterior.data,
      };
      const slots = [slotAnterior, slotNovo].sort(
        (a, b) => a.espacoId - b.espacoId || a.data.localeCompare(b.data),
      );
      for (const slot of slots) await this.lockSlot(tx, slot.espacoId, slot.data);

      const horarioInicio = data.horarioInicio ?? atual.horarioInicio;
      const horarioFim = data.horarioFim ?? atual.horarioFim;
      const status = data.status ?? atual.status;
      if (status !== 'CANCELADA' && status !== 'FINALIZADA') {
        await this.ensureSlotAvailable(
          tx,
          { ...slotNovo, inicio: horarioInicio, fim: horarioFim },
          id,
        );
      }

      return tx.reserva.update({ where: { id }, data: updateData as any });
    });
    return reserva ? this.toEntity(reserva) : null;
  }

  async transitionStatus(
    id: number,
    estadoEsperado: StatusReserva,
    novoEstado: StatusReserva,
    auditoria: TransicaoAuditoria,
  ): Promise<Reserva | null> {
    return this.prisma.$transaction(async (tx) => {
      const atual = await tx.reserva.findUnique({ where: { id } });
      if (!atual || atual.status !== estadoEsperado) return null;

      const dadosReserva: Record<string, unknown> = {
        status: novoEstado,
        updatedAt: new Date(),
      };
      if (auditoria.checkInReal) dadosReserva.checkInReal = new Date(auditoria.checkInReal);
      if (auditoria.checkOutReal) dadosReserva.checkOutReal = new Date(auditoria.checkOutReal);

      const resultado = await tx.reserva.updateMany({
        where: { id, status: estadoEsperado },
        data: dadosReserva as any,
      });
      if (resultado.count === 0) return null;

      await tx.historicoReserva.create({
        data: {
          reservaId: id,
          estadoAnterior: estadoEsperado,
          novoEstado,
          autorId: auditoria.autorId,
          justificativa: auditoria.justificativa,
        },
      });

      const atualizada = await tx.reserva.findUnique({ where: { id } });
      return atualizada ? this.toEntity(atualizada) : null;
    });
  }

  async delete(_id: number): Promise<boolean> {
    throw new ConflictException('Reservas não podem ser excluídas; use a ação CANCELAR para preservar o histórico.');
  }
}
