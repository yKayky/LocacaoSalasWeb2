import { Usuario } from '../entities/usuario.entity';

export abstract class UsuarioRepository {
  abstract findAll(): Promise<Usuario[]> | Usuario[];
  abstract findById(id: number): Promise<Usuario | null> | Usuario | null;
  abstract create(data: { nome: string }): Promise<Usuario> | Usuario;
  abstract update(id: number, data: { nome?: string }): Promise<Usuario | null> | Usuario | null;
  abstract delete(id: number): Promise<boolean> | boolean;
}
