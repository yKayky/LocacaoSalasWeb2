import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Usuario } from '../../domain/entities/usuario.entity';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';

@Injectable()
export class UsuarioPrismaRepository implements UsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(contaId: number): Promise<Usuario[]> {
    const usuarios = await this.prisma.usuario.findMany({ where: { contaId }, orderBy: { id: 'asc' } });
    return usuarios.map((usuario) => new Usuario(usuario));
  }

  async findById(id: number, contaId: number): Promise<Usuario | null> {
    const usuario = await this.prisma.usuario.findFirst({ where: { id, contaId } });
    return usuario ? new Usuario(usuario) : null;
  }

  async create(data: { nome: string; contaId: number }): Promise<Usuario> {
    const usuario = await this.prisma.usuario.create({ data });
    return new Usuario(usuario);
  }

  async update(id: number, data: { nome?: string }, contaId: number): Promise<Usuario | null> {
    const result = await this.prisma.usuario.updateMany({ where: { id, contaId }, data });
    if (result.count === 0) return null;
    return this.findById(id, contaId);
  }

  async delete(id: number, contaId: number): Promise<boolean> {
    const result = await this.prisma.usuario.deleteMany({ where: { id, contaId } });
    return result.count > 0;
  }
}
