import { Reserva, StatusReserva } from '../entities/reserva.entity';

export type DadosNovaReserva = Pick<Reserva, 'contaId' | 'usuarioId' | 'espacoId' | 'data' | 'horarioInicio' | 'horarioFim'>;
export type DadosEdicaoReserva = Partial<Omit<DadosNovaReserva, 'contaId'>>;

export interface TransicaoAuditoria {
  updatedAtEsperado: string;
  autorId: number;
  contaId: number;
  justificativa: string;
  validarSobLock?: (reserva: Reserva, agora: Date) => void;
}

export interface ReservaHistorico {
  tipoEvento: 'CRIACAO' | 'EDICAO' | 'TRANSICAO';
  dadosAnteriores: unknown;
  dadosNovos: unknown;
  idRegistro: number;
  reservaId: number;
  estadoAnterior: StatusReserva | null;
  novoEstado: StatusReserva;
  autorId: number | null;
  autor: { id: number; nome: string } | null;
  justificativa: string;
  timestamp: Date;
}

export abstract class ReservaRepository {
  abstract findAll(contaId: number): Promise<Reserva[]> | Reserva[];
  abstract findById(id: number, contaId: number): Promise<Reserva | null> | Reserva | null;
  abstract findHistory(id: number, contaId: number): Promise<ReservaHistorico[]> | ReservaHistorico[];
  abstract create(
    data: DadosNovaReserva,
    autorId: number,
  ): Promise<Reserva> | Reserva;
  abstract update(id: number, data: DadosEdicaoReserva, updatedAtEsperado: string, contaId: number): Promise<Reserva | null> | Reserva | null;
  abstract transitionStatus(
    id: number,
    estadoEsperado: StatusReserva,
    novoEstado: StatusReserva,
    auditoria: TransicaoAuditoria,
  ): Promise<Reserva | null> | Reserva | null;
  abstract delete(id: number): Promise<boolean> | boolean;
}
