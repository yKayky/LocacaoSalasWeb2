import { Usuario } from '../entities/usuario.entity';

export abstract class UsuarioRepository {
  abstract findAll(contaId: number): Promise<Usuario[]> | Usuario[];
  abstract findById(id: number, contaId: number): Promise<Usuario | null> | Usuario | null;
  abstract create(data: { nome: string; contaId: number }): Promise<Usuario> | Usuario;
  abstract update(id: number, data: { nome?: string }, contaId: number): Promise<Usuario | null> | Usuario | null;
  abstract delete(id: number, contaId: number): Promise<boolean> | boolean;
}
