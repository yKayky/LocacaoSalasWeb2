import { Reserva, StatusReserva } from '../entities/reserva.entity';

export interface TransicaoAuditoria {
  updatedAtEsperado: string;
  autorId: number;
  justificativa: string;
  checkInReal?: string;
  checkOutReal?: string;
}

export interface ReservaHistorico {
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
  abstract findAll(): Promise<Reserva[]> | Reserva[];
  abstract findById(id: number): Promise<Reserva | null> | Reserva | null;
  abstract findHistory(id: number): Promise<ReservaHistorico[]> | ReservaHistorico[];
  abstract create(
    data: Omit<Reserva, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
    autorId: number,
  ): Promise<Reserva> | Reserva;
  abstract update(id: number, data: Partial<Reserva>, updatedAtEsperado: string): Promise<Reserva | null> | Reserva | null;
  abstract transitionStatus(
    id: number,
    estadoEsperado: StatusReserva,
    novoEstado: StatusReserva,
    auditoria: TransicaoAuditoria,
  ): Promise<Reserva | null> | Reserva | null;
  abstract delete(id: number): Promise<boolean> | boolean;
}
