import { HorarioCheckInGuarda } from '../../domain/entities/reserva-guardas';

export const GUARDAS_TRANSICAO_RESERVA = Symbol('GUARDAS_TRANSICAO_RESERVA');

export const reservaGuardasProvider = {
  provide: GUARDAS_TRANSICAO_RESERVA,
  useFactory: () => [new HorarioCheckInGuarda()],
};
