import { Injectable, BadRequestException } from '@nestjs/common';
import { EspacoRepository } from '../../domain/repositories/espaco.repository';
import { Espaco } from '../../domain/entities/espaco.entity';

export interface CreateEspacoInput {
  nome: string;
  descricao: string;
  capacidade: number;
  localizacao: string;
  valorPorHora: number;
}

@Injectable()
export class CreateEspacoUseCase {
  constructor(private readonly espacoRepository: EspacoRepository) {}

  async execute(input: CreateEspacoInput): Promise<Espaco> {
    if (!input.nome || input.nome.trim() === '') {
      throw new BadRequestException('O nome do espaço é obrigatório.');
    }
    if (input.capacidade <= 0) {
      throw new BadRequestException('A capacidade deve ser maior que zero.');
    }
    if (input.valorPorHora < 0) {
      throw new BadRequestException('O valor por hora não pode ser negativo.');
    }

    return await this.espacoRepository.create({
      nome: input.nome.trim(),
      descricao: input.descricao?.trim() || '',
      capacidade: Number(input.capacidade),
      localizacao: input.localizacao?.trim() || '',
      valorPorHora: Number(input.valorPorHora),
    });
  }
}
