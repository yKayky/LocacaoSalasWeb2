import { Injectable, NotFoundException } from '@nestjs/common';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';

@Injectable()
export class DeleteUsuarioUseCase {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async execute(id: number, contaId: number): Promise<{ success: boolean; message: string }> {
    const existente = await this.usuarioRepository.findById(id, contaId);
    if (!existente) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado.`);
    }

    await this.usuarioRepository.delete(id, contaId);
    return { success: true, message: `Usuário #${id} removido com sucesso.` };
  }
}
