import { Injectable, NotFoundException } from '@nestjs/common';
import { ReservaRepository } from '../../domain/repositories/reserva.repository';
import { Reserva } from '../../domain/entities/reserva.entity';

@Injectable()
export class FindReservaByIdUseCase {
  constructor(private readonly reservaRepository: ReservaRepository) {}

  async execute(id: number): Promise<Reserva> {
    const reserva = await this.reservaRepository.findById(id);
    if (!reserva) {
      throw new NotFoundException('Reserva não encontrada.');
    }
    return reserva;
  }
}
