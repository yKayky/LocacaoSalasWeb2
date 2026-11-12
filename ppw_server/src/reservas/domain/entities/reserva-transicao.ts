import { StatusReserva } from './reserva.entity';

export class TransicaoReservaInvalida extends Error {}

export type AcaoReserva = 'CONFIRMAR' | 'INICIAR' | 'FINALIZAR' | 'CANCELAR';

const transicoes: Record<AcaoReserva, Partial<Record<StatusReserva, StatusReserva>>> = {
  CONFIRMAR: { PENDENTE: 'CONFIRMADA' },
  INICIAR: { CONFIRMADA: 'EM_ANDAMENTO' },
  FINALIZAR: { EM_ANDAMENTO: 'FINALIZADA' },
  CANCELAR: { PENDENTE: 'CANCELADA', CONFIRMADA: 'CANCELADA' },
};

export function resolverTransicao(statusAtual: StatusReserva, acao: AcaoReserva): StatusReserva {
  const proximo = transicoes[acao]?.[statusAtual];
  if (!proximo) throw new TransicaoReservaInvalida(`Ação ${acao} não permitida no estado ${statusAtual}.`);
  return proximo;
}

export function transicaoPermitida(atual: StatusReserva, proximo: StatusReserva): boolean {
  return Object.values(transicoes).some((regra) => regra[atual] === proximo);
}
