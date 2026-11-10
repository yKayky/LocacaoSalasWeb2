import { BadRequestException } from '@nestjs/common';
import { StatusReserva } from './reserva.entity';

export type AcaoReserva = 'CONFIRMAR' | 'INICIAR' | 'FINALIZAR' | 'CANCELAR';

const transicoes: Record<AcaoReserva, Partial<Record<StatusReserva, StatusReserva>>> = {
  CONFIRMAR: { PENDENTE: 'CONFIRMADA' },
  INICIAR: { CONFIRMADA: 'EM_ANDAMENTO' },
  FINALIZAR: { EM_ANDAMENTO: 'FINALIZADA' },
  CANCELAR: { PENDENTE: 'CANCELADA', CONFIRMADA: 'CANCELADA' },
};

export function resolverTransicao(statusAtual: StatusReserva, acao: AcaoReserva): StatusReserva {
  const proximo = transicoes[acao]?.[statusAtual];
  if (!proximo) throw new BadRequestException(`Ação ${acao} não permitida no estado ${statusAtual}.`);
  return proximo;
}
