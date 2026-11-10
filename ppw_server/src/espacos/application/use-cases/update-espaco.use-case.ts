import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EspacoRepository } from '../../domain/repositories/espaco.repository';
import { Espaco } from '../../domain/entities/espaco.entity';

export interface UpdateEspacoInput {
  nome?: string;
  descricao?: string;
  capacidade?: number;
  localizacao?: string;
  valorPorHora?: number;
}

@Injectable()
export class UpdateEspacoUseCase {
  constructor(private readonly espacoRepository: EspacoRepository) {}

  async execute(id: number, input: UpdateEspacoInput): Promise<Espaco> {
    const existente = await this.espacoRepository.findById(id);
    if (!existente) {
      throw new NotFoundException(`Espaço com ID ${id} não encontrado.`);
    }

    if (input.nome !== undefined && input.nome.trim() === '') {
      throw new BadRequestException('O nome do espaço não pode ser vazio.');
    }
    if (input.capacidade !== undefined && input.capacidade <= 0) {
      throw new BadRequestException('A capacidade deve ser maior que zero.');
    }
    if (input.valorPorHora !== undefined && input.valorPorHora < 0) {
      throw new BadRequestException('O valor por hora não pode ser negativo.');
    }

    const atualizado = await this.espacoRepository.update(id, {
      ...(input.nome !== undefined ? { nome: input.nome.trim() } : {}),
      ...(input.descricao !== undefined ? { descricao: input.descricao.trim() } : {}),
      ...(input.capacidade !== undefined ? { capacidade: Number(input.capacidade) } : {}),
      ...(input.localizacao !== undefined ? { localizacao: input.localizacao.trim() } : {}),
      ...(input.valorPorHora !== undefined ? { valorPorHora: Number(input.valorPorHora) } : {}),
    });

    if (!atualizado) {
      throw new NotFoundException(`Espaço com ID ${id} não encontrado.`);
    }

    return atualizado;
  }
}
