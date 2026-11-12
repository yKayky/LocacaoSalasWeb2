import { Injectable, NotFoundException } from '@nestjs/common';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { Usuario } from '../../domain/entities/usuario.entity';

@Injectable()
export class FindUsuarioByIdUseCase {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async execute(id: number, contaId: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findById(id, contaId);
    if (!usuario) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }
    return usuario;
  }
}
