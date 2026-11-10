import { IsIn } from 'class-validator';
import { AcaoReserva } from '../../domain/entities/reserva-transicao';

export class AcaoReservaDto {
  @IsIn(['CONFIRMAR', 'INICIAR', 'FINALIZAR', 'CANCELAR'])
  acao!: AcaoReserva;
}
