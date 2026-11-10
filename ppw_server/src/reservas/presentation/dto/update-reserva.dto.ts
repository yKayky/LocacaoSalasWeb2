import { IsIn, IsInt, IsOptional, Matches } from 'class-validator';
import { StatusReserva } from '../../domain/entities/reserva.entity';

export class UpdateReservaDto {
  @IsOptional()
  @IsInt({ message: 'O ID do usuário deve ser um número inteiro' })
  usuarioId?: number;

  @IsOptional()
  @IsInt({ message: 'O ID do espaço deve ser um número inteiro' })
  espacoId?: number;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'A data deve estar no formato AAAA-MM-DD' })
  data?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'O horário de início deve estar no formato HH:mm' })
  horarioInicio?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'O horário de fim deve estar no formato HH:mm' })
  horarioFim?: string;

  @IsOptional()
  @IsIn(['PENDENTE', 'CONFIRMADA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA'], {
    message: 'Status inválido',
  })
  status?: StatusReserva;
}
