import { Injectable } from '@nestjs/common';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { Usuario } from '../../domain/entities/usuario.entity';

@Injectable()
export class FindAllUsuariosUseCase {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async execute(contaId: number): Promise<Usuario[]> {
    return await this.usuarioRepository.findAll(contaId);
  }
}
