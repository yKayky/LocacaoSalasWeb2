import { Injectable, NotFoundException } from '@nestjs/common';
import { EspacoRepository } from '../../domain/repositories/espaco.repository';

@Injectable()
export class DeleteEspacoUseCase {
  constructor(private readonly espacoRepository: EspacoRepository) {}

  async execute(id: number): Promise<{ success: boolean; message: string }> {
    const existente = await this.espacoRepository.findById(id);
    if (!existente) {
      throw new NotFoundException(`Espaço com ID ${id} não encontrado.`);
    }

    await this.espacoRepository.delete(id);
    return { success: true, message: `Espaço #${id} removido com sucesso.` };
  }
}
