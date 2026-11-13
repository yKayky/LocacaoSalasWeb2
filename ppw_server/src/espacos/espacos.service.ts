/** @deprecated Compatibility only; not used by the active application. */
import { Injectable } from '@nestjs/common';
import { Espaco } from './domain/entities/espaco.entity';
import { FindAllEspacosUseCase } from './application/use-cases/find-all-espacos.use-case';
import { FindEspacoByIdUseCase } from './application/use-cases/find-espaco-by-id.use-case';
import { CreateEspacoUseCase } from './application/use-cases/create-espaco.use-case';
import { UpdateEspacoUseCase } from './application/use-cases/update-espaco.use-case';
import { DeleteEspacoUseCase } from './application/use-cases/delete-espaco.use-case';

@Injectable()
export class EspacosService {
  constructor(
    private readonly findAllUseCase: FindAllEspacosUseCase,
    private readonly findByIdUseCase: FindEspacoByIdUseCase,
    private readonly createUseCase: CreateEspacoUseCase,
    private readonly updateUseCase: UpdateEspacoUseCase,
    private readonly deleteUseCase: DeleteEspacoUseCase,
  ) {}

  async findAll(contaId: number): Promise<Espaco[]> {
    return await this.findAllUseCase.execute(contaId);
  }

  async findOne(id: number, contaId: number): Promise<Espaco> {
    return await this.findByIdUseCase.execute(id, contaId);
  }

  async create(dto: Omit<Espaco, 'id' | 'contaId'>, contaId: number): Promise<Espaco> {
    return await this.createUseCase.execute(dto, contaId);
  }

  async update(id: number, dto: Partial<Omit<Espaco, 'id' | 'contaId'>>, contaId: number): Promise<Espaco> {
    return await this.updateUseCase.execute(id, dto, contaId);
  }

  async delete(id: number, contaId: number): Promise<{ success: boolean; message: string }> {
    return await this.deleteUseCase.execute(id, contaId);
  }
}
