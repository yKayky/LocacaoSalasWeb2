import { Injectable } from '@nestjs/common';
import { Usuario } from './domain/entities/usuario.entity';
import { FindAllUsuariosUseCase } from './application/use-cases/find-all-usuarios.use-case';
import { FindUsuarioByIdUseCase } from './application/use-cases/find-usuario-by-id.use-case';
import { CreateUsuarioUseCase } from './application/use-cases/create-usuario.use-case';
import { UpdateUsuarioUseCase } from './application/use-cases/update-usuario.use-case';
import { DeleteUsuarioUseCase } from './application/use-cases/delete-usuario.use-case';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly findAllUseCase: FindAllUsuariosUseCase,
    private readonly findByIdUseCase: FindUsuarioByIdUseCase,
    private readonly createUseCase: CreateUsuarioUseCase,
    private readonly updateUseCase: UpdateUsuarioUseCase,
    private readonly deleteUseCase: DeleteUsuarioUseCase,
  ) {}

  async findAll(contaId: number): Promise<Usuario[]> {
    return await this.findAllUseCase.execute(contaId);
  }

  async findOne(id: number, contaId: number): Promise<Usuario> {
    return await this.findByIdUseCase.execute(id, contaId);
  }

  async create(dto: { nome: string }, contaId: number): Promise<Usuario> {
    return await this.createUseCase.execute(dto, contaId);
  }

  async update(id: number, dto: { nome?: string }, contaId: number): Promise<Usuario> {
    return await this.updateUseCase.execute(id, dto, contaId);
  }

  async delete(id: number, contaId: number): Promise<{ success: boolean; message: string }> {
    return await this.deleteUseCase.execute(id, contaId);
  }
}
