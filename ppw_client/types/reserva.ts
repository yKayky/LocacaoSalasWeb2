export type StatusReserva = 'PENDENTE' | 'CONFIRMADA' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';

export interface Reserva {
  id: number;
  usuarioId: number;
  espacoId: number;
  data: string;
  horarioInicio: string;
  horarioFim: string;
  status: StatusReserva;
  createdAt: string;
  updatedAt: string;
  checkInReal?: string;
  checkOutReal?: string;
}

export interface Usuario { id: number; nome: string; }

export interface Espaco {
  id: number;
  nome: string;
  descricao: string;
  capacidade: number;
  localizacao: string;
  valorPorHora: number;
}

export type DadosReserva = Pick<Reserva, 'usuarioId' | 'espacoId' | 'data' | 'horarioInicio' | 'horarioFim'>;
