import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const errors: Record<string, { status: number; message: string }> = {
      P2000: { status: HttpStatus.BAD_REQUEST, message: 'Um dos campos excede o tamanho permitido.' },
      P2002: { status: HttpStatus.CONFLICT, message: 'Já existe um registro com estes dados únicos.' },
      P2003: {
        status: HttpStatus.CONFLICT,
        message: 'A operação envolve um registro vinculado ou uma referência que deixou de existir.',
      },
      P2004: { status: HttpStatus.BAD_REQUEST, message: 'Os dados violam uma regra de integridade do banco.' },
      P2025: { status: HttpStatus.NOT_FOUND, message: 'O registro solicitado não foi encontrado.' },
      P2034: { status: HttpStatus.CONFLICT, message: 'Houve uma alteração concorrente. Atualize os dados e tente novamente.' },
    };
    const error = errors[exception.code];
    if (!error) this.logger.error(`Falha de persistência com código ${exception.code}`);
    const status = error?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(status).json({
      statusCode: status,
      message: error?.message ?? 'Não foi possível concluir a operação no banco de dados.',
    });
  }
}
