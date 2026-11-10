import { Injectable } from '@nestjs/common';
import { ReservaRepository } from '../../domain/repositories/reserva.repository';
import { Reserva } from '../../domain/entities/reserva.entity';

@Injectable()
export class FindAllReservasUseCase {
  constructor(private readonly reservaRepository: ReservaRepository) {}

  async execute(): Promise<Reserva[]> {
    return await this.reservaRepository.findAll();
  }
}
