import { Injectable } from '@nestjs/common';
import { Usuario } from '../../domain/entities/usuario.entity';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';

@Injectable()
export class InMemoryUsuarioRepository implements UsuarioRepository {
  private usuarios: Usuario[] = [];

  findAll(contaId: number): Promise<Usuario[]> {
    return Promise.resolve(this.usuarios.filter((item) => item.contaId === contaId).map((item) => ({ ...item })));
  }

  findById(id: number, contaId: number): Promise<Usuario | null> {
    const usuario = this.usuarios.find((item) => item.id === id && item.contaId === contaId);
    return Promise.resolve(usuario ? { ...usuario } : null);
  }

  create(data: { nome: string; contaId: number }): Promise<Usuario> {
    const id = this.usuarios.reduce((maior, item) => Math.max(maior, item.id), 0) + 1;
    const novo = new Usuario({ id, nome: data.nome, contaId: data.contaId });
    this.usuarios.push(novo);
    return Promise.resolve({ ...novo });
  }

  update(id: number, data: { nome?: string }, contaId: number): Promise<Usuario | null> {
    const index = this.usuarios.findIndex((item) => item.id === id && item.contaId === contaId);
    if (index === -1) return Promise.resolve(null);

    const atual = this.usuarios[index];
    const atualizado = new Usuario({
      id: atual.id,
      contaId: atual.contaId,
      nome: data.nome ?? atual.nome,
    });

    this.usuarios[index] = atualizado;
    return Promise.resolve({ ...atualizado });
  }

  delete(id: number, contaId: number): Promise<boolean> {
    const index = this.usuarios.findIndex((item) => item.id === id && item.contaId === contaId);
    if (index === -1) return Promise.resolve(false);
    this.usuarios.splice(index, 1);
    return Promise.resolve(true);
  }
}
