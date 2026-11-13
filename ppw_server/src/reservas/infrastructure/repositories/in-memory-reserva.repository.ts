import { ConflictException, Injectable } from '@nestjs/common';
import { Reserva } from '../../domain/entities/reserva.entity';
import { DadosEdicaoReserva, DadosNovaReserva, ReservaHistorico, ReservaRepository, TransicaoAuditoria } from '../../domain/repositories/reserva.repository';
import { StatusReserva } from '../../domain/entities/reserva.entity';
import { dadosAgendamento } from '../../domain/entities/reserva-auditoria';
import { transicaoPermitida } from '../../domain/entities/reserva-transicao';

@Injectable()
export class InMemoryReservaRepository implements ReservaRepository {
  private historicos: ReservaHistorico[] = [];

  private ensureSlotAvailable(data: DadosNovaReserva, ignoredId?: number): void {
    const conflito = this.reservas.some((reserva) =>
      reserva.id !== ignoredId &&
      reserva.status !== 'CANCELADA' && reserva.status !== 'FINALIZADA' &&
      reserva.espacoId === data.espacoId && reserva.data === data.data &&
      reserva.horarioInicio < data.horarioFim && reserva.horarioFim > data.horarioInicio,
    );
    if (conflito) throw new ConflictException('O espaço já possui uma reserva conflitante neste horário.');
  }

  private registrarHistorico(
    reservaId: number,
    estadoAnterior: StatusReserva | null,
    novoEstado: StatusReserva,
    autorId: number,
    justificativa: string,
    tipoEvento: ReservaHistorico['tipoEvento'] = estadoAnterior === null ? 'CRIACAO' : 'TRANSICAO',
    dadosAnteriores: unknown = null,
    dadosNovos: unknown = null,
  ): void {
    this.historicos.push({
      tipoEvento, dadosAnteriores, dadosNovos,
      idRegistro: this.historicos.length + 1,
      reservaId,
      estadoAnterior,
      novoEstado,
      autorId,
      autor: null,
      justificativa,
      timestamp: new Date(),
    });
  }
  private reservas: Reserva[] = [];

  findAll(contaId: number): Promise<Reserva[]> {
    return Promise.resolve(this.reservas.filter((item) => item.contaId === contaId).map((reserva) => ({ ...reserva })));
  }

  findById(id: number, contaId: number): Promise<Reserva | null> {
    const reserva = this.reservas.find((item) => item.id === id && item.contaId === contaId);
    return Promise.resolve(reserva ? { ...reserva } : null);
  }

  findHistory(id: number, contaId: number): ReservaHistorico[] {
    if (!this.reservas.some((reserva) => reserva.id === id && reserva.contaId === contaId)) return [];
    return this.historicos.filter((registro) => registro.reservaId === id)
      .map((registro) => ({ ...structuredClone(registro), timestamp: new Date(registro.timestamp) }));
  }

  async create(
    data: DadosNovaReserva,
    autorId: number,
  ): Promise<Reserva> {
    this.ensureSlotAvailable(data);
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
    this.registrarHistorico(id, null, 'PENDENTE', autorId, 'Reserva criada.', 'CRIACAO', null, dadosAgendamento(nova));
    return Promise.resolve({ ...nova });
  }

  async update(id: number, data: DadosEdicaoReserva, updatedAtEsperado: string, contaId: number): Promise<Reserva | null> {
    const index = this.reservas.findIndex((item) => item.id === id && item.contaId === contaId);
    if (index === -1) return Promise.resolve(null);

    const atual = this.reservas[index];
    if (atual.status !== 'PENDENTE' || atual.updatedAt !== updatedAtEsperado) {
      throw new ConflictException('A reserva foi alterada. Atualize a página antes de editar.');
    }
    const atualizada = new Reserva({
      id: atual.id,
      contaId: atual.contaId,
      usuarioId: data.usuarioId ?? atual.usuarioId,
      espacoId: data.espacoId ?? atual.espacoId,
      data: data.data ?? atual.data,
      horarioInicio: data.horarioInicio ?? atual.horarioInicio,
      horarioFim: data.horarioFim ?? atual.horarioFim,
      status: atual.status,
      createdAt: atual.createdAt,
      updatedAt: new Date(Math.max(Date.now(), Date.parse(atual.updatedAt) + 1)).toISOString(),
      checkInReal: atual.checkInReal,
      checkOutReal: atual.checkOutReal,
    });

    const antes = dadosAgendamento(atual);
    const depois = dadosAgendamento(atualizada);
    if (JSON.stringify(antes) === JSON.stringify(depois)) return { ...atual };
    this.ensureSlotAvailable(atualizada, id);
    this.registrarHistorico(id, atual.status, atual.status, contaId, 'Agendamento alterado.', 'EDICAO', antes, depois);
    this.reservas[index] = atualizada;
    return Promise.resolve({ ...atualizada });
  }

  async transitionStatus(
    id: number,
    estadoEsperado: StatusReserva,
    novoEstado: StatusReserva,
    auditoria: TransicaoAuditoria,
  ): Promise<Reserva | null> {
    const atual = this.reservas.find((item) => item.id === id && item.contaId === auditoria.contaId);
    if (!atual || atual.status !== estadoEsperado) return null;
    if (atual.updatedAt !== auditoria.updatedAtEsperado) {
      throw new ConflictException('A reserva foi alterada. Atualize a página antes de executar a ação.');
    }
    if (!transicaoPermitida(estadoEsperado, novoEstado)) {
      throw new ConflictException('Transição de estado inválida.');
    }
    if (!auditoria.justificativa.trim()) throw new ConflictException('A justificativa é obrigatória.');
    if (novoEstado === 'EM_ANDAMENTO' && this.reservas.some((reserva) =>
      reserva.id !== id && reserva.espacoId === atual.espacoId && reserva.status === 'EM_ANDAMENTO',
    )) {
      throw new ConflictException('O espaço está em uso. Finalize o check-out da reserva anterior.');
    }
    const instante = new Date();
    auditoria.validarSobLock?.({ ...atual }, instante);
    this.registrarHistorico(id, estadoEsperado, novoEstado, auditoria.autorId, auditoria.justificativa);
    atual.status = novoEstado;
    atual.updatedAt = new Date(Math.max(Date.now(), Date.parse(atual.updatedAt) + 1)).toISOString();
    if (novoEstado === 'EM_ANDAMENTO') atual.checkInReal = instante.toISOString();
    if (novoEstado === 'FINALIZADA') atual.checkOutReal = instante.toISOString();
    return { ...atual };
  }

  async delete(): Promise<boolean> {
    throw new ConflictException('Reservas não podem ser excluídas; use a ação CANCELAR para preservar o histórico.');
  }
}
