import { Injectable } from '@nestjs/common';
import { EspacoRepository } from '../../domain/repositories/espaco.repository';
import { Espaco } from '../../domain/entities/espaco.entity';

@Injectable()
export class FindAllEspacosUseCase {
  constructor(private readonly espacoRepository: EspacoRepository) {}

  async execute(): Promise<Espaco[]> {
    return await this.espacoRepository.findAll();
  }
}
