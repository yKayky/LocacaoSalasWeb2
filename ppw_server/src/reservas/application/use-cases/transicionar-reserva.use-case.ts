import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AcaoReserva, resolverTransicao } from '../../domain/entities/reserva-transicao';
import { Reserva } from '../../domain/entities/reserva.entity';
import { ReservaRepository } from '../../domain/repositories/reserva.repository';

@Injectable()
export class TransicionarReservaUseCase {
  constructor(private readonly reservaRepository: ReservaRepository) {}

  async execute(id: number, acao: AcaoReserva): Promise<Reserva> {
    const reserva = await this.reservaRepository.findById(id);
    if (!reserva) throw new NotFoundException('Reserva não encontrada.');
    const status = resolverTransicao(reserva.status, acao);
    const agora = new Date();
    if (acao === 'INICIAR' && agora < new Date(`${reserva.data}T${reserva.horarioInicio}:00`)) {
      throw new BadRequestException('Não é possível iniciar antes do horário agendado.');
    }
    const atualizado = await this.reservaRepository.update(id, {
      status,
      updatedAt: agora.toISOString(),
      ...(acao === 'INICIAR' ? { checkInReal: agora.toISOString() } : {}),
      ...(acao === 'FINALIZAR' ? { checkOutReal: agora.toISOString() } : {}),
    });
    if (!atualizado) throw new NotFoundException('Reserva não encontrada.');
    return atualizado;
  }
}
