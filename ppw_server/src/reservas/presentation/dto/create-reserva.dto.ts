import { IsDateString, IsInt, IsNotEmpty, IsPositive, Matches } from 'class-validator';

export class CreateReservaDto {
  @IsInt({ message: 'O ID do usuário deve ser um número inteiro' })
  @IsPositive()
  usuarioId!: number;

  @IsInt({ message: 'O ID do espaço deve ser um número inteiro' })
  @IsPositive()
  espacoId!: number;

  @IsNotEmpty({ message: 'A data é obrigatória' })
  @IsDateString({ strict: true }, { message: 'A data deve ser uma data real no formato AAAA-MM-DD' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'A data deve estar no formato AAAA-MM-DD' })
  data!: string;

  @IsNotEmpty({ message: 'O horário de início é obrigatório' })
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  horarioInicio!: string;

  @IsNotEmpty({ message: 'O horário de fim é obrigatório' })
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  horarioFim!: string;
}
