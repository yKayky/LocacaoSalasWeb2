import { Module } from '@nestjs/common';
import { ReservasController } from './presentation/controllers/reservas.controller';
import { ReservaRepository } from './domain/repositories/reserva.repository';
import { ReservaPrismaRepository } from './infrastructure/repositories/reserva.prisma.repository';
import { CreateReservaUseCase } from './application/use-cases/create-reserva.use-case';
import { FindAllReservasUseCase } from './application/use-cases/find-all-reservas.use-case';
import { FindReservaByIdUseCase } from './application/use-cases/find-reserva-by-id.use-case';
import { UpdateReservaUseCase } from './application/use-cases/update-reserva.use-case';
import { TransicionarReservaUseCase } from './application/use-cases/transicionar-reserva.use-case';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { EspacosModule } from '../espacos/espacos.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UsuariosModule, EspacosModule, AuthModule],
  controllers: [ReservasController],
  providers: [
    {
      provide: ReservaRepository,
      useClass: ReservaPrismaRepository,
    },
    CreateReservaUseCase,
    FindAllReservasUseCase,
    FindReservaByIdUseCase,
    UpdateReservaUseCase,
    TransicionarReservaUseCase,
  ],
  exports: [
    ReservaRepository,
    CreateReservaUseCase,
    FindAllReservasUseCase,
    FindReservaByIdUseCase,
    UpdateReservaUseCase,
    TransicionarReservaUseCase,
  ],
})
export class ReservasModule {}
