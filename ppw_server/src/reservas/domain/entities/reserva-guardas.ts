import type { Reserva } from './reserva.entity';
import type { AcaoReserva } from './reserva-transicao';

export class GuardaReservaViolada extends Error {}

export interface GuardaTransicaoReserva {
  acao: AcaoReserva;
  validar(reserva: Reserva, agora: Date): void;
}

export class HorarioCheckInGuarda implements GuardaTransicaoReserva {
  readonly acao = 'INICIAR' as const;

  validar(reserva: Reserva, agora: Date): void {
    const inicio = new Date(`${reserva.data}T${reserva.horarioInicio}:00-03:00`);
    const fim = new Date(`${reserva.data}T${reserva.horarioFim}:00-03:00`);
    if (agora < inicio) {
      throw new GuardaReservaViolada('Não é possível iniciar antes do horário agendado.');
    }
    if (agora >= fim) {
      throw new GuardaReservaViolada('O período da reserva terminou. Não é possível realizar o check-in.');
    }
  }
}

export function validarGuardasTransicao(
  guardas: readonly GuardaTransicaoReserva[],
  acao: AcaoReserva,
  reserva: Reserva,
  agora: Date,
): void {
  for (const guarda of guardas) {
    if (guarda.acao === acao) guarda.validar(reserva, agora);
  }
}
