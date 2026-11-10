import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUsuarioDto {
  @IsOptional()
  @IsNotEmpty({ message: 'O nome do usuário não pode ser vazio' })
  @IsString({ message: 'O nome deve ser um texto' })
  nome?: string;
}
