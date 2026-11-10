import { Module } from '@nestjs/common';
import { UsuariosController } from './presentation/controllers/usuarios.controller';
import { UsuarioRepository } from './domain/repositories/usuario.repository';
import { UsuarioPrismaRepository } from './infrastructure/repositories/usuario.prisma.repository';
import { CreateUsuarioUseCase } from './application/use-cases/create-usuario.use-case';
import { FindAllUsuariosUseCase } from './application/use-cases/find-all-usuarios.use-case';
import { FindUsuarioByIdUseCase } from './application/use-cases/find-usuario-by-id.use-case';
import { UpdateUsuarioUseCase } from './application/use-cases/update-usuario.use-case';
import { DeleteUsuarioUseCase } from './application/use-cases/delete-usuario.use-case';
import { UsuariosService } from './usuarios.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UsuariosController],
  providers: [
    {
      provide: UsuarioRepository,
      useClass: UsuarioPrismaRepository,
    },
    CreateUsuarioUseCase,
    FindAllUsuariosUseCase,
    FindUsuarioByIdUseCase,
    UpdateUsuarioUseCase,
    DeleteUsuarioUseCase,
    UsuariosService,
  ],
  exports: [
    UsuarioRepository,
    CreateUsuarioUseCase,
    FindAllUsuariosUseCase,
    FindUsuarioByIdUseCase,
    UpdateUsuarioUseCase,
    DeleteUsuarioUseCase,
    UsuariosService,
  ],
})
export class UsuariosModule {}
