import { IsISO8601, IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { AcaoReserva } from '../../domain/entities/reserva-transicao';

export class AcaoReservaDto {
  @IsISO8601({ strict: true })
  updatedAtEsperado!: string;

  @IsIn(['CONFIRMAR', 'INICIAR', 'FINALIZAR', 'CANCELAR'])
  acao!: AcaoReserva;

  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  @Matches(/\S/, { message: 'A justificativa não pode ficar vazia.' })
  justificativa!: string;

}
