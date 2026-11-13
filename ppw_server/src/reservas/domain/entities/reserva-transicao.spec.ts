import { AcaoReserva, resolverTransicao, TransicaoReservaInvalida } from './reserva-transicao';
import { StatusReserva } from './reserva.entity';

const estados: StatusReserva[] = ['PENDENTE', 'CONFIRMADA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA'];
const acoes: AcaoReserva[] = ['CONFIRMAR', 'INICIAR', 'FINALIZAR', 'CANCELAR'];
const permitidas: Record<string, StatusReserva> = {
  PENDENTE_CONFIRMAR: 'CONFIRMADA', PENDENTE_CANCELAR: 'CANCELADA',
  CONFIRMADA_INICIAR: 'EM_ANDAMENTO', CONFIRMADA_CANCELAR: 'CANCELADA',
  EM_ANDAMENTO_FINALIZAR: 'FINALIZADA',
};
describe('Matriz completa de transicoes', () => {
  test.each(estados.flatMap((estado) => acoes.map((acao) => [estado, acao] as const)))('%s / %s', (estado, acao) => {
    const esperado = permitidas[estado + '_' + acao];
    if (esperado) expect(resolverTransicao(estado, acao)).toBe(esperado);
    else expect(() => resolverTransicao(estado, acao)).toThrow(TransicaoReservaInvalida);
  });
});
