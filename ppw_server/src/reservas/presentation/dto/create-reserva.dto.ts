import { IsInt, IsNotEmpty, Matches } from 'class-validator';

export class CreateReservaDto {
  @IsInt({ message: 'O ID do usuário deve ser um número inteiro' })
  usuarioId!: number;

  @IsInt({ message: 'O ID do espaço deve ser um número inteiro' })
  espacoId!: number;

  @IsNotEmpty({ message: 'A data é obrigatória' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'A data deve estar no formato AAAA-MM-DD' })
  data!: string;

  @IsNotEmpty({ message: 'O horário de início é obrigatório' })
  @Matches(/^\d{2}:\d{2}$/, { message: 'O horário de início deve estar no formato HH:mm' })
  horarioInicio!: string;

  @IsNotEmpty({ message: 'O horário de fim é obrigatório' })
  @Matches(/^\d{2}:\d{2}$/, { message: 'O horário de fim deve estar no formato HH:mm' })
  horarioFim!: string;
}
