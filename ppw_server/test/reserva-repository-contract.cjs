const assert = require('node:assert/strict');

async function verificarContratoReserva(repository, dados, autorId) {
  const contaId = dados.contaId;
  const auditoria = (reserva, justificativa = 'Ação de teste.') => ({
    contaId, autorId, justificativa, updatedAtEsperado: reserva.updatedAt,
  });
  const conflito = (error) => error.getStatus?.() === 409;

  // Missing or inaccessible records always return null, even for an invalid action.
  assert.equal(await repository.transitionStatus(0, 'PENDENTE', 'FINALIZADA', {
    contaId, autorId, justificativa: '', updatedAtEsperado: new Date(0).toISOString(),
  }), null);

  const criada = await repository.create(dados, autorId);
  assert.equal(criada.status, 'PENDENTE');
  const historicoInicial = await repository.findHistory(criada.id, contaId);
  assert.equal(historicoInicial.length, 1);
  assert.equal(historicoInicial[0].autorId, autorId);
  assert.equal(historicoInicial[0].estadoAnterior, null);
  assert.equal(await repository.findById(criada.id, contaId + 1), null);
  assert.deepEqual(await repository.findHistory(criada.id, contaId + 1), []);

  await assert.rejects(() => repository.transitionStatus(
    criada.id, 'PENDENTE', 'FINALIZADA', auditoria(criada),
  ), conflito);
  await assert.rejects(() => repository.transitionStatus(
    criada.id, 'PENDENTE', 'CONFIRMADA', auditoria(criada, '   '),
  ), conflito);
  await assert.rejects(() => repository.update(
    criada.id, { horarioInicio: '08:00' }, new Date(0).toISOString(), contaId,
  ), conflito);
  assert.equal((await repository.findHistory(criada.id, contaId)).length, 1);

  const editavel = await repository.create({ ...dados, data: '2030-01-15' }, autorId);
  const edicoes = await Promise.allSettled([
    repository.update(editavel.id, { horarioFim: '11:00' }, editavel.updatedAt, contaId),
    repository.update(editavel.id, { horarioFim: '12:00' }, editavel.updatedAt, contaId),
  ]);
  assert.equal(edicoes.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(edicoes.filter((r) => r.status === 'rejected').length, 1);
  assert.ok(conflito(edicoes.find((r) => r.status === 'rejected').reason));
  const editada = edicoes.find((r) => r.status === 'fulfilled').value;
  const logsEdicao = await repository.findHistory(editavel.id, contaId);
  assert.equal(logsEdicao.length, 2);
  assert.equal(logsEdicao[1].tipoEvento, 'EDICAO');
  assert.equal(logsEdicao[1].dadosAnteriores.horarioFim, '10:00');
  assert.equal(logsEdicao[1].dadosNovos.horarioFim, editada.horarioFim);
  const semMudanca = await repository.update(editada.id, { horarioFim: editada.horarioFim }, editada.updatedAt, contaId);
  assert.equal(semMudanca.updatedAt, editada.updatedAt);
  assert.equal((await repository.findHistory(editavel.id, contaId)).length, 2);
  logsEdicao[1].dadosNovos.horarioFim = '00:00';
  assert.equal((await repository.findHistory(editavel.id, contaId))[1].dadosNovos.horarioFim, editada.horarioFim);

  const simultaneos = await Promise.allSettled([
    repository.create({ ...dados, data: '2030-01-11' }, autorId),
    repository.create({ ...dados, data: '2030-01-11' }, autorId),
  ]);
  assert.equal(simultaneos.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(simultaneos.filter((result) => result.status === 'rejected').length, 1);
  assert.ok(conflito(simultaneos.find((result) => result.status === 'rejected').reason));

  const primeira = await repository.create({ ...dados, data: '2030-01-12' }, autorId);
  const segunda = await repository.create({
    ...dados, data: '2030-01-12', horarioInicio: '10:00', horarioFim: '11:00',
  }, autorId);
  const confirmadas = await Promise.all([primeira, segunda].map((reserva) =>
    repository.transitionStatus(reserva.id, 'PENDENTE', 'CONFIRMADA', auditoria(reserva)),
  ));
  const checkIns = await Promise.allSettled(confirmadas.map((reserva) =>
    repository.transitionStatus(reserva.id, 'CONFIRMADA', 'EM_ANDAMENTO', {
      ...auditoria(reserva), checkInReal: new Date().toISOString(),
    }),
  ));
  assert.equal(checkIns.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(checkIns.filter((result) => result.status === 'rejected').length, 1);
  assert.ok(conflito(checkIns.find((result) => result.status === 'rejected').reason));
  const emUso = checkIns.find((result) => result.status === 'fulfilled').value;
  const aguardando = confirmadas.find((reserva) => reserva.id !== emUso.id);
  assert.equal((await repository.findHistory(aguardando.id, contaId)).length, 2);
  const finalizada = await repository.transitionStatus(emUso.id, 'EM_ANDAMENTO', 'FINALIZADA', {
    ...auditoria(emUso), checkOutReal: new Date().toISOString(),
  });
  assert.equal(finalizada.status, 'FINALIZADA');
  const novoUso = await repository.transitionStatus(aguardando.id, 'CONFIRMADA', 'EM_ANDAMENTO', {
    ...auditoria(aguardando), checkInReal: new Date().toISOString(),
  });
  assert.equal(novoUso.status, 'EM_ANDAMENTO');
  await repository.transitionStatus(novoUso.id, 'EM_ANDAMENTO', 'FINALIZADA', {
    ...auditoria(novoUso), checkOutReal: new Date().toISOString(),
  });

  const cancelada = await repository.transitionStatus(criada.id, 'PENDENTE', 'CANCELADA', auditoria(criada));
  assert.equal(cancelada.status, 'CANCELADA');
  assert.equal((await repository.findHistory(criada.id, contaId)).length, 2);
  await repository.create(dados, autorId);
  assert.equal(await repository.transitionStatus(criada.id, 'PENDENTE', 'CONFIRMADA', auditoria(criada)), null);

  const lista = await repository.findAll(contaId);
  lista[0].status = 'EM_ANDAMENTO';
  assert.equal((await repository.findById(criada.id, contaId)).status, 'CANCELADA');
}

module.exports = { verificarContratoReserva };
