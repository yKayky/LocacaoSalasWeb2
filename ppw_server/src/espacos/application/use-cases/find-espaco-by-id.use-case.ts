import { Injectable, NotFoundException } from '@nestjs/common';
import { EspacoRepository } from '../../domain/repositories/espaco.repository';
import { Espaco } from '../../domain/entities/espaco.entity';

@Injectable()
export class FindEspacoByIdUseCase {
  constructor(private readonly espacoRepository: EspacoRepository) {}

  async execute(id: number): Promise<Espaco> {
    const espaco = await this.espacoRepository.findById(id);
    if (!espaco) {
      throw new NotFoundException(`Espaço com ID ${id} não encontrado.`);
    }
    return espaco;
  }
}
