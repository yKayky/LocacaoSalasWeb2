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
  updatedAtEsperado: string;
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
    const reserva = await this.reservaRepository.findById(id, actor.id);
    if (!reserva) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    ReservaPermissaoPolicy.validarEdicao(actor, reserva.contaId);

    if (reserva.updatedAt !== input.updatedAtEsperado) {
      throw new ConflictException('A reserva foi alterada. Atualize a pagina antes de editar.');
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
      const usuario = await this.usuarioRepository.findById(usuarioId, actor.id);
      if (!usuario) throw new NotFoundException('Usuário não encontrado.');
    }

    if (input.espacoId !== undefined) {
      const espaco = await this.espacoRepository.findById(espacoId, actor.id);
      if (!espaco) throw new NotFoundException('Espaço não encontrado.');
    }

    if (horarioInicio >= horarioFim) {
      throw new BadRequestException('O horário de fim deve ser maior que o horário de início.');
    }

    const atualizada = await this.reservaRepository.update(id, {
      usuarioId,
      espacoId,
      data,
      horarioInicio,
      horarioFim,
    }, input.updatedAtEsperado, actor.id);

    if (!atualizada) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    return atualizada;
  }

}
