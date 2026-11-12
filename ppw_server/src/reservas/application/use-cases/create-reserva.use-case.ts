import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ReservaRepository } from '../../domain/repositories/reserva.repository';
import { UsuarioRepository } from '../../../usuarios/domain/repositories/usuario.repository';
import { EspacoRepository } from '../../../espacos/domain/repositories/espaco.repository';
import { Reserva } from '../../domain/entities/reserva.entity';
import { AuthenticatedUser } from '../../../auth/authenticated-user';

export interface CreateReservaInput {
  usuarioId: number;
  espacoId: number;
  data: string;
  horarioInicio: string;
  horarioFim: string;
}

@Injectable()
export class CreateReservaUseCase {
  constructor(
    private readonly reservaRepository: ReservaRepository,
    private readonly usuarioRepository: UsuarioRepository,
    private readonly espacoRepository: EspacoRepository,
  ) {}

  async execute(input: CreateReservaInput, actor: AuthenticatedUser): Promise<Reserva> {
    const usuarioId = input.usuarioId;
    const usuario = await this.usuarioRepository.findById(usuarioId, actor.id);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const espaco = await this.espacoRepository.findById(input.espacoId, actor.id);
    if (!espaco) {
      throw new NotFoundException('Espaço não encontrado.');
    }

    if (input.horarioInicio >= input.horarioFim) {
      throw new BadRequestException('O horário de fim deve ser maior que o horário de início.');
    }

    return await this.reservaRepository.create({
      contaId: actor.id,
      usuarioId,
      espacoId: input.espacoId,
      data: input.data,
      horarioInicio: input.horarioInicio,
      horarioFim: input.horarioFim,
    }, actor.id);
  }
}
