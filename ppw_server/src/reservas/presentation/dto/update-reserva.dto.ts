import { IsDateString, IsInt, IsPositive, Matches, ValidateIf } from 'class-validator';

export class UpdateReservaDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt({ message: 'O ID do usuário deve ser um número inteiro' })
  @IsPositive()
  usuarioId?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsInt({ message: 'O ID do espaço deve ser um número inteiro' })
  @IsPositive()
  espacoId?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsDateString({ strict: true }, { message: 'Data inválida.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'A data deve estar no formato AAAA-MM-DD' })
  data?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  horarioInicio?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  horarioFim?: string;

}
