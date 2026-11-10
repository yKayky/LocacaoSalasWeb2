import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { Usuario } from '../../domain/entities/usuario.entity';

export interface UpdateUsuarioInput {
  nome?: string;
}

@Injectable()
export class UpdateUsuarioUseCase {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async execute(id: number, input: UpdateUsuarioInput): Promise<Usuario> {
    const existente = await this.usuarioRepository.findById(id);
    if (!existente) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    if (input.nome !== undefined && input.nome.trim() === '') {
      throw new BadRequestException('O nome do usuário não pode ser vazio.');
    }

    const atualizado = await this.usuarioRepository.update(id, {
      ...(input.nome !== undefined ? { nome: input.nome.trim() } : {}),
    });

    if (!atualizado) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    return atualizado;
  }
}
