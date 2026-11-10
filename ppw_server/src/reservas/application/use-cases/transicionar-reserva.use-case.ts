import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AcaoReserva, resolverTransicao } from '../../domain/entities/reserva-transicao';
import { Reserva } from '../../domain/entities/reserva.entity';
import { ReservaRepository } from '../../domain/repositories/reserva.repository';
import { UsuarioRepository } from '../../../usuarios/domain/repositories/usuario.repository';

@Injectable()
export class TransicionarReservaUseCase {
  constructor(
    private readonly reservaRepository: ReservaRepository,
    private readonly usuarioRepository: UsuarioRepository,
  ) {}

  async execute(id: number, acao: AcaoReserva, justificativa: string, autorId?: number): Promise<Reserva> {
    const reserva = await this.reservaRepository.findById(id);
    if (!reserva) throw new NotFoundException('Reserva não encontrada.');
    if (!justificativa.trim()) throw new BadRequestException('A justificativa é obrigatória.');
    if (autorId !== undefined && !(await this.usuarioRepository.findById(autorId))) {
      throw new NotFoundException('Autor não encontrado.');
    }
    const status = resolverTransicao(reserva.status, acao);
    const agora = new Date();
    if (acao === 'INICIAR' && agora < new Date(`${reserva.data}T${reserva.horarioInicio}:00`)) {
      throw new BadRequestException('Não é possível iniciar antes do horário agendado.');
    }
    const atualizado = await this.reservaRepository.transitionStatus(id, reserva.status, status, {
      autorId,
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
