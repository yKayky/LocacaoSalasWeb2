import { IsNotEmpty, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

export class UpdateUsuarioDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsNotEmpty({ message: 'O nome do usuário não pode ser vazio' })
  @IsString({ message: 'O nome deve ser um texto' })
  @Matches(/\S/, { message: 'O nome deve conter texto.' })
  @MaxLength(150)
  nome?: string;
}
