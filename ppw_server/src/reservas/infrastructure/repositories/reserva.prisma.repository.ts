import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma, Reserva as PrismaReserva } from '@prisma/client';
import { Reserva, StatusReserva } from '../../domain/entities/reserva.entity';
import { DadosEdicaoReserva, DadosNovaReserva, ReservaHistorico, ReservaRepository, TransicaoAuditoria } from '../../domain/repositories/reserva.repository';
import { dadosAgendamento } from '../../domain/entities/reserva-auditoria';
import { transicaoPermitida } from '../../domain/entities/reserva-transicao';

@Injectable()
export class ReservaPrismaRepository implements ReservaRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async lockSlot(
    tx: Prisma.TransactionClient,
    espacoId: number,
    data: string,
  ): Promise<void> {
    const dia = new Date(`${data}T00:00:00.000Z`).getTime() / 86_400_000;
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(${espacoId}::integer, ${dia}::integer)`;
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

  private toEntity(record: PrismaReserva): Reserva {
    return new Reserva({
      id: record.id,
      contaId: record.contaId,
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
    });
  }

  async findAll(contaId: number): Promise<Reserva[]> {
    const reservas = await this.prisma.reserva.findMany({ where: { contaId }, orderBy: { data: 'asc' } });
    return reservas.map((reserva) => this.toEntity(reserva));
  }

  async findById(id: number, contaId: number): Promise<Reserva | null> {
    const reserva = await this.prisma.reserva.findFirst({ where: { id, contaId } });
    return reserva ? this.toEntity(reserva) : null;
  }

  async findHistory(id: number, contaId: number): Promise<ReservaHistorico[]> {
    const registros = await this.prisma.historicoReserva.findMany({
      where: { reservaId: id, reserva: { contaId } },
      include: { autor: { select: { id: true, nome: true } } },
      orderBy: [{ timestamp: 'asc' }, { idRegistro: 'asc' }],
    });
    return registros.map((registro) => ({ ...registro, tipoEvento: registro.tipoEvento ?? (registro.estadoAnterior === null ? 'CRIACAO' : 'TRANSICAO') }));
  }

  async create(
    data: DadosNovaReserva,
    autorId: number,
  ): Promise<Reserva> {
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
          contaId: data.contaId,
          usuarioId: data.usuarioId,
          espacoId: data.espacoId,
          data: new Date(`${data.data}T00:00:00.000Z`),
          horarioInicio: data.horarioInicio,
          horarioFim: data.horarioFim,
        },
      });
      await tx.historicoReserva.create({
        data: {
          tipoEvento: 'CRIACAO',
          dadosNovos: dadosAgendamento(this.toEntity(criada)),
          reservaId: criada.id,
          estadoAnterior: null,
          novoEstado: 'PENDENTE',
          autorId,
          justificativa: 'Reserva criada.',
        },
      });
      return criada;
    });
    return this.toEntity(reserva);
  }

  async update(id: number, data: DadosEdicaoReserva, updatedAtEsperado: string, contaId: number): Promise<Reserva | null> {
    const updateData: Prisma.ReservaUncheckedUpdateInput = {};
    if (data.usuarioId !== undefined) updateData.usuarioId = data.usuarioId;
    if (data.espacoId !== undefined) updateData.espacoId = data.espacoId;
    if (data.data !== undefined) updateData.data = new Date(`${data.data}T00:00:00.000Z`);
    if (data.horarioInicio !== undefined) updateData.horarioInicio = data.horarioInicio;
    if (data.horarioFim !== undefined) updateData.horarioFim = data.horarioFim;

    const reserva = await this.prisma.$transaction(async (tx) => {
      // Serialize edits and transitions before reading the current reservation.
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(${id}::bigint)`;
      const atual = await tx.reserva.findFirst({ where: { id, contaId } });
      if (!atual) return null;
      if (atual.status !== 'PENDENTE' || atual.updatedAt.toISOString() !== updatedAtEsperado) {
        throw new ConflictException('A reserva foi alterada. Atualize a página antes de editar.');
      }
      const antes = dadosAgendamento(this.toEntity(atual));
      const depois = { ...antes, ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) };
      if (JSON.stringify(antes) === JSON.stringify(depois)) return atual;
      updateData.updatedAt = new Date(Math.max(Date.now(), atual.updatedAt.getTime() + 1));

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
      await this.ensureSlotAvailable(
        tx,
        { ...slotNovo, inicio: horarioInicio, fim: horarioFim },
        id,
      );

      const editada = await tx.reserva.update({ where: { id }, data: updateData });
      await tx.historicoReserva.create({ data: {
        reservaId: id, tipoEvento: 'EDICAO', estadoAnterior: atual.status, novoEstado: atual.status,
        autorId: contaId, justificativa: 'Agendamento alterado.', dadosAnteriores: antes,
        dadosNovos: dadosAgendamento(this.toEntity(editada)),
      } });
      return editada;
    });
    return reserva ? this.toEntity(reserva) : null;
  }

  async transitionStatus(
    id: number,
    estadoEsperado: StatusReserva,
    novoEstado: StatusReserva,
    auditoria: TransicaoAuditoria,
  ): Promise<Reserva | null> {
    const contaId = auditoria.contaId;
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(${id}::bigint)`;
      const atual = await tx.reserva.findFirst({ where: { id, contaId } });
      if (!atual || atual.status !== estadoEsperado) return null;
      if (atual.updatedAt.toISOString() !== auditoria.updatedAtEsperado) {
        throw new ConflictException('A reserva foi alterada. Atualize a página antes de executar a ação.');
      }
      if (!transicaoPermitida(estadoEsperado, novoEstado)) {
        throw new ConflictException('Transição de estado inválida.');
      }
      if (!auditoria.justificativa.trim()) throw new ConflictException('A justificativa é obrigatória.');

      if (novoEstado === 'EM_ANDAMENTO' || estadoEsperado === 'EM_ANDAMENTO') {
        // Negative bigint keys serialize physical occupancy across all dates.
        const chaveOcupacao = -atual.espacoId;
        await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(${chaveOcupacao}::bigint)`;
      }
      if (novoEstado === 'EM_ANDAMENTO') {
        const ocupada = await tx.reserva.findFirst({
          where: { espacoId: atual.espacoId, status: 'EM_ANDAMENTO', id: { not: id } },
        });
        if (ocupada) {
          throw new ConflictException('O espaço está em uso. Finalize o check-out da reserva anterior.');
        }
      }

      const instante = new Date();
      auditoria.validarSobLock?.(this.toEntity(atual), instante);
      const dadosReserva: Prisma.ReservaUpdateManyMutationInput = {
        status: novoEstado,
        updatedAt: new Date(Math.max(Date.now(), atual.updatedAt.getTime() + 1)),
      };
      if (novoEstado === 'EM_ANDAMENTO') dadosReserva.checkInReal = instante;
      if (novoEstado === 'FINALIZADA') dadosReserva.checkOutReal = instante;

      const resultado = await tx.reserva.updateMany({
        where: { id, contaId, status: estadoEsperado },
        data: dadosReserva,
      });
      if (resultado.count === 0) return null;

      await tx.historicoReserva.create({
        data: {
          tipoEvento: 'TRANSICAO',
          reservaId: id,
          estadoAnterior: estadoEsperado,
          novoEstado,
          autorId: auditoria.autorId,
          justificativa: auditoria.justificativa,
        },
      });

      const atualizada = await tx.reserva.findFirst({ where: { id, contaId: auditoria.contaId } });
      return atualizada ? this.toEntity(atualizada) : null;
    });
  }

  async delete(): Promise<boolean> {
    throw new ConflictException('Reservas não podem ser excluídas; use a ação CANCELAR para preservar o histórico.');
  }
}
