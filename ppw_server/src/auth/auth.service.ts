import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaService } from '../database/prisma.service';
import type { Prisma } from '@prisma/client';
import { AuthenticatedUser } from './authenticated-user';

const scrypt = promisify(scryptCallback);
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
  }

  private async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    if (!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(storedHash)) return false;
    const [saltHex, keyHex] = storedHash.split(':');
    if (!saltHex || !keyHex) return false;
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(keyHex, 'hex');
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  private hashSessionToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async createSession(user: AuthenticatedUser, database: Prisma.TransactionClient = this.prisma) {
    const token = randomBytes(32).toString('base64url');
    const expiraEm = new Date(Date.now() + SESSION_DURATION_MS);
    await database.sessaoUsuario.create({
      data: {
        contaId: user.id,
        tokenHash: this.hashSessionToken(token),
        expiraEm,
      },
    });
    return { token, user, expiraEm };
  }

  async register(input: { nome: string; email: string; senha: string }) {
    const email = input.email.trim().toLowerCase();
    const senhaHash = await this.hashPassword(input.senha);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.conta.create({
          data: {
            nome: input.nome.trim(),
            credencial: { create: { email, senhaHash } },
          },
          select: { id: true, nome: true, papel: true },
        });
        return this.createSession(user, tx);
      });
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Este e-mail já está cadastrado.');
      }
      throw error;
    }
  }

  async login(input: { email: string; senha: string }) {
    const credentials = await this.prisma.credencialUsuario.findUnique({
      where: { email: input.email.trim().toLowerCase() },
      include: { conta: { select: { id: true, nome: true, papel: true } } },
    });
    if (!credentials || !(await this.verifyPassword(input.senha, credentials.senhaHash))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }
    return this.createSession(credentials.conta);
  }

  async authenticate(token: string): Promise<AuthenticatedUser | null> {
    const session = await this.prisma.sessaoUsuario.findUnique({
      where: { tokenHash: this.hashSessionToken(token) },
      include: { conta: { select: { id: true, nome: true, papel: true } } },
    });
    if (!session || session.expiraEm <= new Date()) return null;
    return session.conta;
  }

  async logout(token: string): Promise<void> {
    await this.prisma.sessaoUsuario.deleteMany({
      where: { tokenHash: this.hashSessionToken(token) },
    });
  }

  static get sessionDurationMs(): number {
    return SESSION_DURATION_MS;
  }
}
