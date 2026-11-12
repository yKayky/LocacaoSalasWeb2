import { IsInt, IsNumber, IsString, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';

export class UpdateEspacoDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString({ message: 'O nome deve ser um texto' })
  @Matches(/\S/, { message: 'O nome deve conter texto.' })
  @MaxLength(150)
  nome?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString({ message: 'A descrição deve ser um texto' })
  @Matches(/\S/, { message: 'A descrição deve conter texto.' })
  descricao?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsNumber({}, { message: 'A capacidade deve ser um número' })
  @Min(1, { message: 'A capacidade mínima é 1 pessoa' })
  @IsInt({ message: 'A capacidade deve ser um número inteiro.' })
  @Max(2147483647)
  capacidade?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString({ message: 'A localização deve ser um texto' })
  @Matches(/\S/, { message: 'A localização deve conter texto.' })
  @MaxLength(255)
  localizacao?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsNumber({}, { message: 'O valor por hora deve ser um número' })
  @Min(0, { message: 'O valor por hora não pode ser negativo' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'O valor por hora deve ter até duas casas decimais.' })
  @Max(99999999.99)
  valorPorHora?: number;
}
