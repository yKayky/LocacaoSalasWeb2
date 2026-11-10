import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateUsuarioDto {
  @IsNotEmpty({ message: 'O nome do usuário é obrigatório' })
  @IsString({ message: 'O nome deve ser um texto' })
  @Matches(/\S/, { message: 'O nome deve conter texto.' })
  @MaxLength(150)
  nome!: string;
}
