import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateEspacoDto {
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @IsString({ message: 'O nome deve ser um texto' })
  nome!: string;

  @IsNotEmpty({ message: 'A descrição é obrigatória' })
  @IsString({ message: 'A descrição deve ser um texto' })
  descricao!: string;

  @IsNotEmpty({ message: 'A capacidade é obrigatória' })
  @IsNumber({}, { message: 'A capacidade deve ser um número' })
  @Min(1, { message: 'A capacidade mínima é 1 pessoa' })
  capacidade!: number;

  @IsNotEmpty({ message: 'A localização é obrigatória' })
  @IsString({ message: 'A localização deve ser um texto' })
  localizacao!: string;

  @IsNotEmpty({ message: 'O valor por hora é obrigatório' })
  @IsNumber({}, { message: 'O valor por hora deve ser um número' })
  @Min(0, { message: 'O valor por hora não pode ser negativo' })
  valorPorHora!: number;
}
