import { Test } from '@nestjs/testing';
import { EspacosModule } from '../espacos/espacos.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { ReservasModule } from './reservas.module';
import { ReservasService } from './reservas.service';

describe('ReservasService', () => {
  let service: ReservasService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [UsuariosModule, EspacosModule, ReservasModule],
    }).compile();
    service = module.get(ReservasService);
  });

  it('cria uma reserva com status PENDENTE', async () => {
    const reserva = await service.create({
      usuarioId: 1,
      espacoId: 4,
      data: '2026-10-01',
      horarioInicio: '09:00',
      horarioFim: '10:00',
    });
    expect(reserva.status).toBe('PENDENTE');
  });

  it('rejeita horário ocupado para o mesmo espaço', async () => {
    await expect(
      service.create({
        usuarioId: 3,
        espacoId: 1,
        data: '2026-09-20',
        horarioInicio: '08:00',
        horarioFim: '09:00',
      }),
    ).rejects.toThrow('O espaço já possui uma reserva conflitante neste horário.');
  });

  it('aceita uma transição válida', async () => {
    const atualizada = await service.update(2, { status: 'CONFIRMADA' });
    expect(atualizada.status).toBe('CONFIRMADA');
  });

  it('rejeita uma transição inválida', async () => {
    await expect(service.update(1, { status: 'FINALIZADA' })).rejects.toThrow(
      'Transição inválida',
    );
  });
});
