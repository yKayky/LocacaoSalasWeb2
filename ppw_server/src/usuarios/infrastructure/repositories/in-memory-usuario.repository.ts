import { Injectable } from '@nestjs/common';
import { Usuario } from '../../domain/entities/usuario.entity';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';

@Injectable()
export class InMemoryUsuarioRepository implements UsuarioRepository {
  private usuarios: Usuario[] = [
    new Usuario({ id: 1, nome: 'João Silva' }),
    new Usuario({ id: 2, nome: 'Maria Oliveira' }),
    new Usuario({ id: 3, nome: 'Carlos Santos' }),
  ];

  findAll(): Promise<Usuario[]> {
    return Promise.resolve([...this.usuarios]);
  }

  findById(id: number): Promise<Usuario | null> {
    const usuario = this.usuarios.find((item) => item.id === id);
    return Promise.resolve(usuario ? { ...usuario } : null);
  }

  create(data: { nome: string }): Promise<Usuario> {
    const id = this.usuarios.reduce((maior, item) => Math.max(maior, item.id), 0) + 1;
    const novo = new Usuario({ id, nome: data.nome });
    this.usuarios.push(novo);
    return Promise.resolve({ ...novo });
  }

  update(id: number, data: { nome?: string }): Promise<Usuario | null> {
    const index = this.usuarios.findIndex((item) => item.id === id);
    if (index === -1) return Promise.resolve(null);

    const atual = this.usuarios[index];
    const atualizado = new Usuario({
      id: atual.id,
      nome: data.nome ?? atual.nome,
    });

    this.usuarios[index] = atualizado;
    return Promise.resolve({ ...atualizado });
  }

  delete(id: number): Promise<boolean> {
    const index = this.usuarios.findIndex((item) => item.id === id);
    if (index === -1) return Promise.resolve(false);
    this.usuarios.splice(index, 1);
    return Promise.resolve(true);
  }
}
