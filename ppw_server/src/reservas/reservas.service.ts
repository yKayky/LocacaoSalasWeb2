import { Injectable } from '@nestjs/common';
import { Reserva } from './domain/entities/reserva.entity';
import { CreateReservaDto } from './presentation/dto/create-reserva.dto';
import { UpdateReservaDto } from './presentation/dto/update-reserva.dto';
import { FindAllReservasUseCase } from './application/use-cases/find-all-reservas.use-case';
import { FindReservaByIdUseCase } from './application/use-cases/find-reserva-by-id.use-case';
import { CreateReservaUseCase } from './application/use-cases/create-reserva.use-case';
import { UpdateReservaUseCase } from './application/use-cases/update-reserva.use-case';
import { DeleteReservaUseCase } from './application/use-cases/delete-reserva.use-case';
import type { AuthenticatedUser } from '../auth/authenticated-user';

@Injectable()
export class ReservasService {
  constructor(
    private readonly findAllUseCase: FindAllReservasUseCase,
    private readonly findByIdUseCase: FindReservaByIdUseCase,
    private readonly createUseCase: CreateReservaUseCase,
    private readonly updateUseCase: UpdateReservaUseCase,
    private readonly deleteUseCase: DeleteReservaUseCase,
  ) {}

  async findAll(contaId: number): Promise<Reserva[]> {
    return await this.findAllUseCase.execute(contaId);
  }

  async findOne(id: number, contaId: number): Promise<Reserva> {
    return await this.findByIdUseCase.execute(id, contaId);
  }

  async create(dto: CreateReservaDto, actor: AuthenticatedUser): Promise<Reserva> {
    return await this.createUseCase.execute(dto, actor);
  }

  async update(id: number, dto: UpdateReservaDto, actor: AuthenticatedUser): Promise<Reserva> {
    return await this.updateUseCase.execute(id, dto, actor);
  }

  async delete(id: number, contaId: number): Promise<{ success: boolean; message: string }> {
    return await this.deleteUseCase.execute(id, contaId);
  }
}
