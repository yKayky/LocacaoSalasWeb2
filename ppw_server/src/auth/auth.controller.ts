import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import type { AuthenticatedUser } from './authenticated-user';
import { AuthService } from './auth.service';
import { getSessionToken, AuthSessionGuard } from './auth-session.guard';
import { CurrentUser } from './current-user.decorator';
import { LoginDto, RegisterDto } from './auth.dto';

const COOKIE_NAME = 'locacao_session';
const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setSessionCookie(response: Response, token: string) {
    response.cookie(COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: AuthService.sessionDurationMs,
    });
  }

  @Post('registrar')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.authService.register(dto);
    this.setSessionCookie(response, session.token);
    return session.user;
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.authService.login(dto);
    this.setSessionCookie(response, session.token);
    return session.user;
  }

  @UseGuards(AuthSessionGuard)
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = getSessionToken(request);
    if (token) await this.authService.logout(token);
    response.clearCookie(COOKIE_NAME, cookieOptions);
    return { success: true };
  }

  @UseGuards(AuthSessionGuard)
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
