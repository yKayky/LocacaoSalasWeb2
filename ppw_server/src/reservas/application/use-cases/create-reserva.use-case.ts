import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ReservaRepository } from '../../domain/repositories/reserva.repository';
import { UsuarioRepository } from '../../../usuarios/domain/repositories/usuario.repository';
import { EspacoRepository } from '../../../espacos/domain/repositories/espaco.repository';
import { Reserva } from '../../domain/entities/reserva.entity';

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

  async execute(input: CreateReservaInput): Promise<Reserva> {
    const usuario = await this.usuarioRepository.findById(input.usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const espaco = await this.espacoRepository.findById(input.espacoId);
    if (!espaco) {
      throw new NotFoundException('Espaço não encontrado.');
    }

    if (input.horarioInicio >= input.horarioFim) {
      throw new BadRequestException('O horário de fim deve ser maior que o horário de início.');
    }

    const todas = await this.reservaRepository.findAll();
    const conflito = todas.some((reserva) => {
      if (reserva.status === 'CANCELADA' || reserva.status === 'FINALIZADA') return false;
      if (reserva.espacoId !== input.espacoId || reserva.data !== input.data) return false;
      return input.horarioInicio < reserva.horarioFim && input.horarioFim > reserva.horarioInicio;
    });

    if (conflito) {
      throw new ConflictException('O espaço já possui uma reserva conflitante neste horário.');
    }

    return await this.reservaRepository.create({
      usuarioId: input.usuarioId,
      espacoId: input.espacoId,
      data: input.data,
      horarioInicio: input.horarioInicio,
      horarioFim: input.horarioFim,
    });
  }
}
