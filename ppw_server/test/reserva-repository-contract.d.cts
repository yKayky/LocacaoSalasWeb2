import type { DadosNovaReserva, ReservaRepository } from '../src/reservas/domain/repositories/reserva.repository';

export function verificarContratoReserva(
  repository: ReservaRepository,
  dados: DadosNovaReserva,
  autorId: number,
): Promise<void>;
