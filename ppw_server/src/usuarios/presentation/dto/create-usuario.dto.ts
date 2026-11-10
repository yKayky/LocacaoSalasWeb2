import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUsuarioDto {
  @IsNotEmpty({ message: 'O nome do usuário é obrigatório' })
  @IsString({ message: 'O nome deve ser um texto' })
  nome!: string;
}
