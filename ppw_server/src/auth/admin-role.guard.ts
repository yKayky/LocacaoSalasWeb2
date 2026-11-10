import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedRequest } from './auth-session.guard';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.authenticatedUser?.papel !== 'ADMIN') {
      throw new ForbiddenException('Esta operação exige o papel ADMIN.');
    }
    return true;
  }
}
