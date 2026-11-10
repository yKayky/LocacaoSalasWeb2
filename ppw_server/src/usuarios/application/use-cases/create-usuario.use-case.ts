import { Injectable, BadRequestException } from '@nestjs/common';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { Usuario } from '../../domain/entities/usuario.entity';

export interface CreateUsuarioInput {
  nome: string;
}

@Injectable()
export class CreateUsuarioUseCase {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async execute(input: CreateUsuarioInput): Promise<Usuario> {
    if (!input.nome || input.nome.trim() === '') {
      throw new BadRequestException('O nome do usuário é obrigatório.');
    }

    return await this.usuarioRepository.create({
      nome: input.nome.trim(),
    });
  }
}
