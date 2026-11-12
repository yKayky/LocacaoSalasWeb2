import { InMemoryReservaRepository } from './infrastructure/repositories/in-memory-reserva.repository';

import { verificarContratoReserva } from '../../test/reserva-repository-contract.cjs';

describe('Contrato do repositório de reservas', () => {
  it('cumpre histórico, isolamento, concorrência e ocupação exclusiva em memória', async () => {
    await verificarContratoReserva(new InMemoryReservaRepository(), {
      contaId: 1, usuarioId: 1, espacoId: 1,
      data: '2030-01-10', horarioInicio: '09:00', horarioFim: '10:00',
    }, 1);
  });
});
