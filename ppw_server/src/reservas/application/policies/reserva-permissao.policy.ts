import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../../../auth/authenticated-user';
import { AcaoReserva } from '../../domain/entities/reserva-transicao';

export class ReservaPermissaoPolicy {
  static validarTransicao(
    actor: AuthenticatedUser,
    acao: AcaoReserva,
    usuarioReservaId: number,
  ): void {
    if (actor.papel === 'ADMIN' || actor.papel === 'OPERADOR') return;
    if (actor.papel === 'CLIENTE' && acao === 'CANCELAR' && actor.id === usuarioReservaId) return;
    throw new ForbiddenException('Seu papel não permite executar esta ação nesta reserva.');
  }

  static validarEdicao(actor: AuthenticatedUser, usuarioReservaId: number): void {
    if (actor.papel !== 'CLIENTE' || actor.id === usuarioReservaId) return;
    throw new ForbiddenException('Você só pode editar as próprias reservas.');
  }

  static validarLeitura(actor: AuthenticatedUser, usuarioReservaId: number): void {
    if (actor.papel === 'ADMIN' || actor.papel === 'OPERADOR' || actor.id === usuarioReservaId) return;
    throw new ForbiddenException('Você só pode consultar as próprias reservas.');
  }
}
