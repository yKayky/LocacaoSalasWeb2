import { Injectable, NotFoundException } from '@nestjs/common';
import { ReservaRepository } from '../../domain/repositories/reserva.repository';

@Injectable()
export class DeleteReservaUseCase {
  constructor(private readonly reservaRepository: ReservaRepository) {}

  async execute(id: number): Promise<{ success: boolean; message: string }> {
    const existente = await this.reservaRepository.findById(id);
    if (!existente) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    await this.reservaRepository.delete(id);
    return { success: true, message: `Reserva #${id} removida com sucesso.` };
  }
}
