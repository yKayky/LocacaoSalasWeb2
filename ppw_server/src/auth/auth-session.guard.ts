import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser } from './authenticated-user';
import { AuthService } from './auth.service';

export interface AuthenticatedRequest extends Request {
  authenticatedUser: AuthenticatedUser;
}

export function getSessionToken(request: Request): string | undefined {
  const cookies = request.headers.cookie?.split(';') ?? [];
  const sessionCookie = cookies.find((cookie) => cookie.trim().startsWith('locacao_session='));
  return sessionCookie?.trim().slice('locacao_session='.length);
}

@Injectable()
export class AuthSessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = getSessionToken(request);
    const user = token ? await this.authService.authenticate(token) : null;
    if (!user) throw new UnauthorizedException('Faça login para continuar.');
    request.authenticatedUser = user;
    return true;
  }
}
