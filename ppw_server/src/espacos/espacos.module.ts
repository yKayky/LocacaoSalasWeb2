import { Module } from '@nestjs/common';
import { EspacosController } from './presentation/controllers/espacos.controller';
import { EspacoRepository } from './domain/repositories/espaco.repository';
import { EspacoPrismaRepository } from './infrastructure/repositories/espaco.prisma.repository';
import { CreateEspacoUseCase } from './application/use-cases/create-espaco.use-case';
import { FindAllEspacosUseCase } from './application/use-cases/find-all-espacos.use-case';
import { FindEspacoByIdUseCase } from './application/use-cases/find-espaco-by-id.use-case';
import { UpdateEspacoUseCase } from './application/use-cases/update-espaco.use-case';
import { DeleteEspacoUseCase } from './application/use-cases/delete-espaco.use-case';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [EspacosController],
  providers: [
    {
      provide: EspacoRepository,
      useClass: EspacoPrismaRepository,
    },
    CreateEspacoUseCase,
    FindAllEspacosUseCase,
    FindEspacoByIdUseCase,
    UpdateEspacoUseCase,
    DeleteEspacoUseCase,
  ],
  exports: [
    EspacoRepository,
    CreateEspacoUseCase,
    FindAllEspacosUseCase,
    FindEspacoByIdUseCase,
    UpdateEspacoUseCase,
    DeleteEspacoUseCase,
  ],
})
export class EspacosModule {}
