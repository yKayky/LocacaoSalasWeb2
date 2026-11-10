import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ReservaRepository } from '../../domain/repositories/reserva.repository';
import { UsuarioRepository } from '../../../usuarios/domain/repositories/usuario.repository';
import { EspacoRepository } from '../../../espacos/domain/repositories/espaco.repository';
import { Reserva, StatusReserva } from '../../domain/entities/reserva.entity';

export interface UpdateReservaInput {
  usuarioId?: number;
  espacoId?: number;
  data?: string;
  horarioInicio?: string;
  horarioFim?: string;
  status?: StatusReserva;
}

@Injectable()
export class UpdateReservaUseCase {
  constructor(
    private readonly reservaRepository: ReservaRepository,
    private readonly usuarioRepository: UsuarioRepository,
    private readonly espacoRepository: EspacoRepository,
  ) {}

  async execute(id: number, input: UpdateReservaInput): Promise<Reserva> {
    const reserva = await this.reservaRepository.findById(id);
    if (!reserva) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    const usuarioId = input.usuarioId ?? reserva.usuarioId;
    const espacoId = input.espacoId ?? reserva.espacoId;
    const data = input.data ?? reserva.data;
    const horarioInicio = input.horarioInicio ?? reserva.horarioInicio;
    const horarioFim = input.horarioFim ?? reserva.horarioFim;

    if (input.usuarioId !== undefined) {
      const usuario = await this.usuarioRepository.findById(usuarioId);
      if (!usuario) throw new NotFoundException('Usuário não encontrado.');
    }

    if (input.espacoId !== undefined) {
      const espaco = await this.espacoRepository.findById(espacoId);
      if (!espaco) throw new NotFoundException('Espaço não encontrado.');
    }

    if (horarioInicio >= horarioFim) {
      throw new BadRequestException('O horário de fim deve ser maior que o horário de início.');
    }

    let checkInReal = reserva.checkInReal;
    let checkOutReal = reserva.checkOutReal;

    if (input.status && input.status !== reserva.status) {
      this.validarTransicao(reserva.status, input.status);

      if (input.status === 'EM_ANDAMENTO') {
        const agora = new Date();
        const inicioReserva = new Date(`${data}T${horarioInicio}:00`);
        if (agora < inicioReserva) {
          throw new BadRequestException('Não é possível realizar o check-in antes do horário agendado.');
        }
        checkInReal = agora.toISOString();
      }

      if (input.status === 'FINALIZADA' && reserva.status === 'EM_ANDAMENTO') {
        checkOutReal = new Date().toISOString();
      }
    }

    const todas = await this.reservaRepository.findAll();
    const conflito = todas.some((r) => {
      if (r.id === id || r.status === 'CANCELADA' || r.status === 'FINALIZADA') return false;
      if (r.espacoId !== espacoId || r.data !== data) return false;
      return horarioInicio < r.horarioFim && horarioFim > r.horarioInicio;
    });

    if (conflito) {
      throw new ConflictException('O espaço já possui uma reserva conflitante neste horário.');
    }

    const agoraIso = new Date().toISOString();
    const atualizada = await this.reservaRepository.update(id, {
      ...input,
      usuarioId,
      espacoId,
      data,
      horarioInicio,
      horarioFim,
      checkInReal,
      checkOutReal,
      updatedAt: agoraIso,
    });

    if (!atualizada) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    return atualizada;
  }

  private validarTransicao(atual: StatusReserva, proximo: StatusReserva) {
    const permitidas: Record<StatusReserva, StatusReserva[]> = {
      PENDENTE: ['CONFIRMADA', 'EM_ANDAMENTO', 'CANCELADA'],
      CONFIRMADA: ['EM_ANDAMENTO', 'CANCELADA'],
      EM_ANDAMENTO: ['FINALIZADA'],
      FINALIZADA: [],
      CANCELADA: [],
    };
    if (!permitidas[atual]?.includes(proximo)) {
      throw new BadRequestException(`Transição inválida: ${atual} → ${proximo}.`);
    }
  }
}
