import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateEspacoDto {
  @IsOptional()
  @IsString({ message: 'O nome deve ser um texto' })
  nome?: string;

  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto' })
  descricao?: string;

  @IsOptional()
  @IsNumber({}, { message: 'A capacidade deve ser um número' })
  @Min(1, { message: 'A capacidade mínima é 1 pessoa' })
  capacidade?: number;

  @IsOptional()
  @IsString({ message: 'A localização deve ser um texto' })
  localizacao?: string;

  @IsOptional()
  @IsNumber({}, { message: 'O valor por hora deve ser um número' })
  @Min(0, { message: 'O valor por hora não pode ser negativo' })
  valorPorHora?: number;
}
