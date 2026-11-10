import { IsDateString, IsInt, IsOptional, IsPositive, Matches } from 'class-validator';

export class UpdateReservaDto {
  @IsOptional()
  @IsInt({ message: 'O ID do usuário deve ser um número inteiro' })
  @IsPositive()
  usuarioId?: number;

  @IsOptional()
  @IsInt({ message: 'O ID do espaço deve ser um número inteiro' })
  @IsPositive()
  espacoId?: number;

  @IsOptional()
  @IsDateString({ strict: true }, { message: 'Data inválida.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'A data deve estar no formato AAAA-MM-DD' })
  data?: string;

  @IsOptional()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  horarioInicio?: string;

  @IsOptional()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  horarioFim?: string;

}
