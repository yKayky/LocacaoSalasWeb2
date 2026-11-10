import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AcaoReserva, resolverTransicao } from '../../domain/entities/reserva-transicao';
import { Reserva } from '../../domain/entities/reserva.entity';
import { ReservaRepository } from '../../domain/repositories/reserva.repository';
import { AuthenticatedUser } from '../../../auth/authenticated-user';
import { ReservaPermissaoPolicy } from '../policies/reserva-permissao.policy';

@Injectable()
export class TransicionarReservaUseCase {
  constructor(
    private readonly reservaRepository: ReservaRepository,
  ) {}

  async execute(id: number, acao: AcaoReserva, justificativa: string, actor: AuthenticatedUser): Promise<Reserva> {
    const reserva = await this.reservaRepository.findById(id);
    if (!reserva) throw new NotFoundException('Reserva não encontrada.');
    if (!justificativa.trim()) throw new BadRequestException('A justificativa é obrigatória.');
    ReservaPermissaoPolicy.validarTransicao(actor, acao, reserva.usuarioId);
    const status = resolverTransicao(reserva.status, acao);
    const agora = new Date();
    if (acao === 'INICIAR' && agora < new Date(`${reserva.data}T${reserva.horarioInicio}:00`)) {
      throw new BadRequestException('Não é possível iniciar antes do horário agendado.');
    }
    const atualizado = await this.reservaRepository.transitionStatus(id, reserva.status, status, {
      autorId: actor.id,
      justificativa: justificativa.trim(),
      ...(acao === 'INICIAR' ? { checkInReal: agora.toISOString() } : {}),
      ...(acao === 'FINALIZAR' ? { checkOutReal: agora.toISOString() } : {}),
    });
    if (!atualizado) {
      const atual = await this.reservaRepository.findById(id);
      if (!atual) throw new NotFoundException('Reserva não encontrada.');
      throw new ConflictException('A reserva mudou de estado; atualize a página e tente novamente.');
    }
    return atualizado;
  }
}
