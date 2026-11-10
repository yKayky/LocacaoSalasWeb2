import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSessionGuard } from './auth-session.guard';
import { AdminRoleGuard } from './admin-role.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthSessionGuard, AdminRoleGuard],
  exports: [AuthService, AuthSessionGuard, AdminRoleGuard],
})
export class AuthModule {}
