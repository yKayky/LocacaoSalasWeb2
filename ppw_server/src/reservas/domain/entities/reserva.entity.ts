export type StatusReserva =
  | 'PENDENTE'
  | 'CONFIRMADA'
  | 'EM_ANDAMENTO'
  | 'FINALIZADA'
  | 'CANCELADA';

export class Reserva {
  id: number;
  usuarioId: number;
  espacoId: number;
  data: string;
  horarioInicio: string; // HH:mm
  horarioFim: string; // HH:mm
  status: StatusReserva;
  createdAt: string;
  updatedAt: string;
  checkInReal?: string; // ISO string
  checkOutReal?: string; // ISO string
  tempoExcedenteMinutos?: number;
  valorExcedente?: number;

  constructor(props: {
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
    tempoExcedenteMinutos?: number;
    valorExcedente?: number;
  }) {
    this.id = props.id;
    this.usuarioId = props.usuarioId;
    this.espacoId = props.espacoId;
    this.data = props.data;
    this.horarioInicio = props.horarioInicio;
    this.horarioFim = props.horarioFim;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.checkInReal = props.checkInReal;
    this.checkOutReal = props.checkOutReal;
    this.tempoExcedenteMinutos = props.tempoExcedenteMinutos;
    this.valorExcedente = props.valorExcedente;
  }
}
