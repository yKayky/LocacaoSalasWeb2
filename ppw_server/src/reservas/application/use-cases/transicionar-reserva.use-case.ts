import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AcaoReserva, resolverTransicao, TransicaoReservaInvalida } from '../../domain/entities/reserva-transicao';
import { Reserva } from '../../domain/entities/reserva.entity';
import { ReservaRepository } from '../../domain/repositories/reserva.repository';
import { AuthenticatedUser } from '../../../auth/authenticated-user';
import { ReservaPermissaoPolicy } from '../policies/reserva-permissao.policy';
import { GuardaReservaViolada, HorarioCheckInGuarda, validarGuardasTransicao } from '../../domain/entities/reserva-guardas';
import type { GuardaTransicaoReserva } from '../../domain/entities/reserva-guardas';
import { GUARDAS_TRANSICAO_RESERVA } from '../policies/reserva-guardas.provider';

@Injectable()
export class TransicionarReservaUseCase {
  constructor(
    private readonly reservaRepository: ReservaRepository,
    @Inject(GUARDAS_TRANSICAO_RESERVA)
    private readonly guardas: readonly GuardaTransicaoReserva[] = [new HorarioCheckInGuarda()],
  ) {}

  async execute(id: number, acao: AcaoReserva, justificativa: string, actor: AuthenticatedUser, updatedAtEsperado: string): Promise<Reserva> {
    const reserva = await this.reservaRepository.findById(id, actor.id);
    if (!reserva) throw new NotFoundException('Reserva não encontrada.');
    if (!justificativa.trim()) throw new BadRequestException('A justificativa é obrigatória.');
    ReservaPermissaoPolicy.validarTransicao(actor, acao, reserva.contaId);
    if (reserva.updatedAt !== updatedAtEsperado) {
      throw new ConflictException('A reserva foi alterada. Atualize a pagina antes de executar a acao.');
    }
    let status: Reserva['status'];
    const agora = new Date();
    try {
      status = resolverTransicao(reserva.status, acao);
      validarGuardasTransicao(this.guardas, acao, reserva, agora);
    } catch (error) {
      if (error instanceof TransicaoReservaInvalida || error instanceof GuardaReservaViolada) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
    const atualizado = await this.reservaRepository.transitionStatus(id, reserva.status, status, {
      updatedAtEsperado,
      validarSobLock: (atual, instante) => {
        try { validarGuardasTransicao(this.guardas, acao, atual, instante); }
        catch (error) {
          if (error instanceof GuardaReservaViolada) throw new BadRequestException(error.message);
          throw error;
        }
      },
      autorId: actor.id,
      contaId: actor.id,
      justificativa: justificativa.trim(),
    });
    if (!atualizado) {
      const atual = await this.reservaRepository.findById(id, actor.id);
      if (!atual) throw new NotFoundException('Reserva não encontrada.');
      throw new ConflictException('A reserva mudou de estado; atualize a página e tente novamente.');
    }
    return atualizado;
  }
}
