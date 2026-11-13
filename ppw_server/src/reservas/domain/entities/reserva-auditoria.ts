import { Reserva } from './reserva.entity';

export function dadosAgendamento(reserva: Pick<Reserva, 'usuarioId' | 'espacoId' | 'data' | 'horarioInicio' | 'horarioFim'>) {
  return {
    usuarioId: reserva.usuarioId, espacoId: reserva.espacoId, data: reserva.data,
    horarioInicio: reserva.horarioInicio, horarioFim: reserva.horarioFim,
  };
}
