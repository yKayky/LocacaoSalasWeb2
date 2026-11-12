import type { ArgumentsHost } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaExceptionFilter } from './prisma-exception.filter';

describe('Respostas HTTP das constraints', () => {
  it.each([
    { code: 'P2014', postgresCode: undefined, status: 409 },
    { code: 'P2010', postgresCode: '23P01', status: 409 },
    { code: 'P2010', postgresCode: '23514', status: 400 },
    { code: 'P2010', postgresCode: '40P01', status: 409 },
  ])('traduz $code/$postgresCode para $status', ({ code, postgresCode, status }) => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ArgumentsHost;
    const error = new Prisma.PrismaClientKnownRequestError('Detalhes internos do banco', {
      code, clientVersion: '7.10.1', meta: { code: postgresCode },
    });
    new PrismaExceptionFilter().catch(error, host);
    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.json).toHaveBeenCalledWith({ statusCode: status, message: expect.any(String) });
    expect(response.json.mock.calls[0][0].message).not.toContain('Detalhes internos');
  });
});
