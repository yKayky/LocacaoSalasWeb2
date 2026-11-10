import { IsIn, IsString, Matches, MinLength } from 'class-validator';
import { AcaoReserva } from '../../domain/entities/reserva-transicao';

export class AcaoReservaDto {
  @IsIn(['CONFIRMAR', 'INICIAR', 'FINALIZAR', 'CANCELAR'])
  acao!: AcaoReserva;

  @IsString()
  @MinLength(3)
  @Matches(/\S/, { message: 'A justificativa não pode ficar vazia.' })
  justificativa!: string;

}
