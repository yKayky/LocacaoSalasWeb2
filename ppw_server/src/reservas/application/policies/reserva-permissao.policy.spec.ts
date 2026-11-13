import { ForbiddenException } from '@nestjs/common';
import { ReservaPermissaoPolicy } from './reserva-permissao.policy';
import { AuthenticatedUser } from '../../../auth/authenticated-user';
import { AcaoReserva } from '../../domain/entities/reserva-transicao';

const papeis: AuthenticatedUser['papel'][] = ['ADMIN', 'OPERADOR', 'CLIENTE'];
const acoes: AcaoReserva[] = ['CONFIRMAR', 'INICIAR', 'FINALIZAR', 'CANCELAR'];
describe('Permissoes de contas independentes', () => {
  test.each(papeis.flatMap((papel) => acoes.map((acao) => [papel, acao] as const)))('%s / %s', (papel, acao) => {
    const actor = { id: 1, nome: 'Conta', papel };
    if (papel !== 'CLIENTE' || acao === 'CANCELAR') {
      expect(() => ReservaPermissaoPolicy.validarTransicao(actor, acao, 1)).not.toThrow();
    } else expect(() => ReservaPermissaoPolicy.validarTransicao(actor, acao, 1)).toThrow(ForbiddenException);
    expect(() => ReservaPermissaoPolicy.validarTransicao(actor, acao, 2)).toThrow(ForbiddenException);
  });
});
