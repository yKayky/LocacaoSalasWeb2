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
import { AuthenticatedUser } from '../../../auth/authenticated-user';
import { ReservaPermissaoPolicy } from '../policies/reserva-permissao.policy';

export interface UpdateReservaInput {
  usuarioId?: number;
  espacoId?: number;
  data?: string;
  horarioInicio?: string;
  horarioFim?: string;
}

@Injectable()
export class UpdateReservaUseCase {
  constructor(
    private readonly reservaRepository: ReservaRepository,
    private readonly usuarioRepository: UsuarioRepository,
    private readonly espacoRepository: EspacoRepository,
  ) {}

  async execute(id: number, input: UpdateReservaInput, actor: AuthenticatedUser): Promise<Reserva> {
    const reserva = await this.reservaRepository.findById(id);
    if (!reserva) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    ReservaPermissaoPolicy.validarEdicao(actor, reserva.usuarioId);
    if (actor.papel === 'CLIENTE' && input.usuarioId !== undefined && input.usuarioId !== actor.id) {
      throw new BadRequestException('Não é permitido transferir uma reserva para outro usuário.');
    }

    if (reserva.status !== 'PENDENTE') {
      throw new BadRequestException('Só é possível editar uma reserva pendente.');
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

    const todas = await this.reservaRepository.findAll();
    const conflito = todas.some((r) => {
      if (r.id === id || r.status === 'CANCELADA' || r.status === 'FINALIZADA') return false;
      if (r.espacoId !== espacoId || r.data !== data) return false;
      return horarioInicio < r.horarioFim && horarioFim > r.horarioInicio;
    });

    if (conflito) {
      throw new ConflictException('O espaço já possui uma reserva conflitante neste horário.');
    }

    const atualizada = await this.reservaRepository.update(id, {
      usuarioId,
      espacoId,
      data,
      horarioInicio,
      horarioFim,
    }, reserva.updatedAt);

    if (!atualizada) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    return atualizada;
  }

}
