import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from '../database/prisma.module';
import { ReservasModule } from '../reservas/reservas.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { EspacosModule } from '../espacos/espacos.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ReservasModule,
    UsuariosModule,
    EspacosModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
