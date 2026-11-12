'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ReservaStatusBadge } from '@/components/reservas/reserva-status-badge';
import { useReservas } from '@/components/reservas/reserva-provider';
import { Reserva } from '@/types/reserva';

export default function PaginaReservas() {
  const {
    reservas,
    usuarios,
    espacos,
    loading,
    error,
    authUser,
    alterarStatus,
    editarReserva,
  } = useReservas();

  // Filtros
  const [busca, setBusca] = useState('');
  const [data, setData] = useState('');
  const [status, setStatus] = useState('');
  const [espacoId, setEspacoId] = useState('');

  // Controle de Alteração e Exclusão
  const [reservaEditando, setReservaEditando] = useState<Reserva | null>(null);
  const [editUsuarioId, setEditUsuarioId] = useState('');
  const [editEspacoId, setEditEspacoId] = useState('');
  const [editData, setEditData] = useState('');
  const [editHorarioInicio, setEditHorarioInicio] = useState('');
  const [editHorarioFim, setEditHorarioFim] = useState('');

  const [salvando, setSalvando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');

  const filtradas = reservas
    .filter((reserva) => {
      const usuario = usuarios.find((u) => u.id === reserva.usuarioId)?.nome ?? '';
      const espaco = espacos.find((e) => e.id === reserva.espacoId)?.nome ?? '';
      return (
        (!data || reserva.data === data) &&
        (!status || reserva.status === status) &&
        (!espacoId || reserva.espacoId === Number(espacoId)) &&
        `${usuario} ${espaco}`.toLowerCase().includes(busca.toLowerCase())
      );
    })
    .sort((a, b) => `${a.data}${a.horarioInicio}`.localeCompare(`${b.data}${b.horarioInicio}`));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 animate-pulse">Carregando reservas...</div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="max-w-xl space-y-4 rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
        <h1 className="text-xl font-semibold text-white">Entre para consultar suas reservas</h1>
        {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
        <Link href="/login" className="inline-block rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white">
          Entrar ou criar conta
        </Link>
      </div>
    );
  }

  // Iniciar alteração
  function iniciarEdicao(r: Reserva) {
    setReservaEditando(r);
    setEditUsuarioId(String(r.usuarioId));
    setEditEspacoId(String(r.espacoId));
    setEditData(r.data);
    setEditHorarioInicio(r.horarioInicio);
    setEditHorarioFim(r.horarioFim);
    setMensagemErro('');
  }

  // Salvar alteração
  async function onSubmitAlterar(e: React.FormEvent) {
    e.preventDefault();
    if (!reservaEditando) return;
    setMensagemErro('');
    setSalvando(true);
    try {
      await editarReserva(reservaEditando.id, {
        usuarioId: Number(editUsuarioId),
        espacoId: Number(editEspacoId),
        data: editData,
        horarioInicio: editHorarioInicio,
        horarioFim: editHorarioFim,
      });
      setReservaEditando(null);
    } catch (err) {
      setMensagemErro(err instanceof Error ? err.message : 'Erro ao atualizar reserva');
    } finally {
      setSalvando(false);
    }
  }

  async function mudarStatus(reserva: Reserva, status: Reserva['status']) {
    const justificativasAutomaticas: Partial<Record<Reserva['status'], string>> = {
      CONFIRMADA: 'Reserva confirmada.',
      EM_ANDAMENTO: 'Check-in realizado.',
      FINALIZADA: 'Check-out realizado.',
    };
    const justificativa = justificativasAutomaticas[status]
      ?? window.prompt('Informe a justificativa para esta mudança:');
    if (justificativa === null) return;
    try {
      await alterarStatus(reserva.id, status, justificativa);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível atualizar a reserva.');
    }
  }

  const isManager = authUser?.papel === 'ADMIN' || authUser?.papel === 'OPERADOR';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Reservas</h1>
          <p className="mt-1 text-sm text-slate-400">Gerencie as locações de salas e espaços</p>
        </div>
        <Link
          href="/reservas/nova"
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/30"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Reserva (Incluir)
        </Link>
      </div>

      {(error || mensagemErro) && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-rose-400 text-sm flex items-center justify-between">
          <span>{mensagemErro || error}</span>
          {mensagemErro && (
            <button onClick={() => setMensagemErro('')} className="text-xs underline text-rose-300">
              Fechar
            </button>
          )}
        </div>
      )}

      {/* Formulário de Alteração (Modal) */}
      {reservaEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <form
            onSubmit={onSubmitAlterar}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-amber-500/40 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                Alterar Reserva #{reservaEditando.id}
              </h2>
              <button
                type="button"
                onClick={() => setReservaEditando(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuário *</span>
              <select
                required
                value={editUsuarioId}
                onChange={(e) => setEditUsuarioId(e.target.value)}
                className="mt-1.5 block w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-400"
              >
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Espaço / Sala *</span>
              <select
                required
                value={editEspacoId}
                onChange={(e) => setEditEspacoId(e.target.value)}
                className="mt-1.5 block w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-400"
              >
                {espacos.map((esp) => (
                  <option key={esp.id} value={esp.id}>
                    {esp.nome} — R$ {Number(esp.valorPorHora).toFixed(2)}/h
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block sm:col-span-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Data *</span>
                <input
                  required
                  type="date"
                  value={editData}
                  onChange={(e) => setEditData(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-400"
                />
              </label>
              <label className="block sm:col-span-1.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Início *</span>
                <input
                  required
                  type="time"
                  value={editHorarioInicio}
                  onChange={(e) => setEditHorarioInicio(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-400"
                />
              </label>
              <label className="block sm:col-span-1.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fim *</span>
                <input
                  required
                  type="time"
                  value={editHorarioFim}
                  onChange={(e) => setEditHorarioFim(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-400"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setReservaEditando(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 transition-colors disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar usuário ou espaço..."
            className="w-full rounded-xl bg-slate-900/60 border border-slate-700 pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
        <input
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          className="w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
        >
          <option value="">Todos os status</option>
          {['PENDENTE', 'CONFIRMADA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA'].map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <select
          value={espacoId}
          onChange={(e) => setEspacoId(e.target.value)}
          className="w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
        >
          <option value="">Todos os espaços</option>
          {espacos.map((e) => (
            <option key={e.id} value={e.id}>{e.nome}</option>
          ))}
        </select>
      </div>

      {/* Cards de Reservas (Listar) */}
      {filtradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-800/30 border border-slate-700/50 py-16 text-center">
          <svg className="w-12 h-12 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-slate-500 font-medium">Nenhuma reserva encontrada</p>
          <p className="text-slate-600 text-sm mt-1">Tente ajustar os filtros ou crie uma nova reserva</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filtradas.map((reserva) => {
            const espaco = espacos.find((e) => e.id === reserva.espacoId);
            const usuario = usuarios.find((u) => u.id === reserva.usuarioId);
            const agora = new Date();
            const fimReserva = new Date(`${reserva.data}T${reserva.horarioFim}:00-03:00`);
            const atrasada = reserva.status === 'EM_ANDAMENTO' && agora > fimReserva;

            return (
              <div
                key={reserva.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all ${
                  atrasada
                    ? 'bg-rose-950/40 border-rose-500/30'
                    : reserva.status === 'CANCELADA'
                    ? 'bg-slate-800/30 border-slate-700/30 opacity-70'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                {/* Topo do card */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-mono">#{reserva.id}</span>
                        <ReservaStatusBadge status={reserva.status} />
                        {atrasada && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-400">
                            ⚠ Urgente
                          </span>
                        )}
                      </div>
                      <p className="mt-2 font-semibold text-white text-base truncate">{usuario?.nome ?? 'Usuário desconhecido'}</p>
                      <p className="text-sm text-slate-400 truncate">{espaco?.nome ?? 'Espaço desconhecido'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-slate-400 font-medium">{reserva.data}</p>
                      <p className="text-sm font-semibold text-indigo-400 mt-0.5">{reserva.horarioInicio} – {reserva.horarioFim}</p>
                    </div>
                  </div>
                </div>

                {/* Ações: Status, Alterar, Excluir, Detalhes */}
                <div className="space-y-2 pt-3 border-t border-slate-700/50">
                  <div className="flex flex-wrap items-center gap-2">
                    {isManager && (reserva.status === 'PENDENTE' || reserva.status === 'CONFIRMADA') && (
                      <button
                        onClick={() => mudarStatus(reserva, reserva.status === 'PENDENTE' ? 'CONFIRMADA' : 'EM_ANDAMENTO')}
                        className="flex items-center gap-1.5 rounded-lg bg-indigo-600/20 px-2.5 py-1.5 text-xs font-semibold text-indigo-400 hover:bg-indigo-600/30 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                        </svg>
                        {reserva.status === 'PENDENTE' ? 'Confirmar' : 'Check-in'}
                      </button>
                    )}
                    {isManager && reserva.status === 'EM_ANDAMENTO' && (
                      <button
                        onClick={() => mudarStatus(reserva, 'FINALIZADA')}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600/20 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8" />
                        </svg>
                        Check-out
                      </button>
                    )}

                    {/* Botão Alterar */}
                    {reserva.status === 'PENDENTE' && (
                    <button
                      type="button"
                      onClick={() => iniciarEdicao(reserva)}
                      className="flex items-center gap-1 rounded-lg bg-slate-700/50 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Alterar
                    </button>
                    )}


                    <Link
                      href={`/reservas/${reserva.id}`}
                      className="ml-auto text-xs font-medium text-slate-400 hover:text-white transition-colors"
                    >
                      Detalhes →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
