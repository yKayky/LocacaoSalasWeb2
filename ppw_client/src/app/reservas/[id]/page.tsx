'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ReservaStatusBadge } from '@/components/reservas/reserva-status-badge';
import { useReservas } from '@/components/reservas/reserva-provider';
import { StatusReserva } from '@/types/reserva';

const proximaAcao: Partial<Record<StatusReserva, { texto: string; status: StatusReserva; cor: string }>> = {
  PENDENTE: { texto: 'Fazer Check-in', status: 'EM_ANDAMENTO', cor: 'bg-indigo-600 hover:bg-indigo-500 text-white' },
  CONFIRMADA: { texto: 'Fazer Check-in', status: 'EM_ANDAMENTO', cor: 'bg-indigo-600 hover:bg-indigo-500 text-white' },
  EM_ANDAMENTO: { texto: 'Fazer Check-out', status: 'FINALIZADA', cor: 'bg-emerald-600 hover:bg-emerald-500 text-white' },
};

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</dt>
      <dd className="text-sm font-medium text-slate-200">{value}</dd>
    </div>
  );
}

export default function DetalheReserva() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const {
    reservas,
    usuarios,
    espacos,
    loading,
    alterarStatus,
    editarReserva,
    excluirReserva,
  } = useReservas();

  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const reserva = reservas.find((item) => item.id === Number(id));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 animate-pulse">Carregando detalhes...</div>
      </div>
    );
  }

  if (!reserva) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 mb-4">Reserva não encontrada.</p>
        <Link href="/reservas" className="text-indigo-400 hover:text-indigo-300">
          ← Voltar para reservas
        </Link>
      </div>
    );
  }

  const usuario = usuarios.find((item) => item.id === reserva.usuarioId);
  const espaco = espacos.find((item) => item.id === reserva.espacoId);
  const acao = proximaAcao[reserva.status];
  const agora = new Date();
  const fimReserva = new Date(`${reserva.data}T${reserva.horarioFim}:00`);
  const atrasada = reserva.status === 'EM_ANDAMENTO' && agora > fimReserva;

  async function mudarStatus(status: StatusReserva) {
    setErro('');
    setSalvando(true);
    try {
      await alterarStatus(reserva!.id, status);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível atualizar a reserva.');
    } finally {
      setSalvando(false);
    }
  }

  async function editar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const dados = new FormData(event.currentTarget);
    setSalvando(true);
    setErro('');
    try {
      await editarReserva(reserva!.id, {
        usuarioId: Number(dados.get('usuarioId')),
        espacoId: Number(dados.get('espacoId')),
        data: String(dados.get('data')),
        horarioInicio: String(dados.get('horarioInicio')),
        horarioFim: String(dados.get('horarioFim')),
      });
      setEditando(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível editar a reserva.');
    } finally {
      setSalvando(false);
    }
  }

  async function cancelar() {
    if (window.confirm('Confirmar cancelamento desta reserva?')) {
      await mudarStatus('CANCELADA');
    }
  }

  async function excluir() {
    setSalvando(true);
    setErro('');
    try {
      await excluirReserva(reserva!.id);
      router.push('/reservas');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível excluir a reserva.');
      setSalvando(false);
      setConfirmandoExclusao(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Voltar */}
      <Link href="/reservas" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar para reservas
      </Link>

      {/* Modal de confirmação de exclusão */}
      {confirmandoExclusao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/40 p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Excluir Reserva Definitivamente</h3>
            <p className="text-sm text-slate-300">
              Tem certeza que deseja excluir esta reserva? Ela será removida completamente do sistema.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmandoExclusao(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvando}
                onClick={excluir}
                className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-500 transition-colors disabled:opacity-50"
              >
                {salvando ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-mono text-slate-500 mb-1">Reserva #{reserva.id}</p>
          <h1 className="text-2xl font-bold text-white">{usuario?.nome ?? 'Usuário desconhecido'}</h1>
          <p className="text-slate-400 mt-0.5">{espaco?.nome ?? 'Espaço desconhecido'}</p>
        </div>
        <ReservaStatusBadge status={reserva.status} />
      </div>

      {atrasada && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 flex items-center gap-2 text-rose-400 text-sm font-medium">
          ⚠️ O horário da reserva já passou. Realize o check-out urgente para liberar o espaço.
        </div>
      )}

      {erro && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-rose-400 text-sm">
          {erro}
        </div>
      )}

      {/* Card de informações */}
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6 space-y-6">
        <dl className="grid grid-cols-2 gap-5">
          <InfoItem label="Usuário" value={usuario?.nome ?? '—'} />
          <InfoItem label="Espaço" value={espaco?.nome ?? '—'} />
          <InfoItem label="Data" value={reserva.data} />
          <InfoItem label="Período" value={`${reserva.horarioInicio} até ${reserva.horarioFim}`} />
          <InfoItem label="Valor / hora" value={espaco ? `R$ ${Number(espaco.valorPorHora).toFixed(2)}` : '—'} />
          {reserva.checkInReal && (
            <InfoItem label="Check-in real" value={new Date(reserva.checkInReal).toLocaleString('pt-BR')} />
          )}
          {reserva.checkOutReal && (
            <InfoItem label="Check-out real" value={new Date(reserva.checkOutReal).toLocaleString('pt-BR')} />
          )}
          <InfoItem label="Criada em" value={new Date(reserva.createdAt).toLocaleString('pt-BR')} />
        </dl>

        {/* Botões de ação */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-700/50">
          {acao && (
            <button
              disabled={salvando}
              onClick={() => mudarStatus(acao.status)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 shadow-lg ${acao.cor}`}
            >
              {salvando ? 'Salvando...' : acao.texto}
            </button>
          )}

          {/* Alterar (Editar) */}
          <button
            disabled={salvando}
            onClick={() => setEditando(!editando)}
            className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
          >
            {editando ? 'Cancelar edição' : 'Alterar Reserva'}
          </button>

          {(reserva.status === 'PENDENTE' || reserva.status === 'CONFIRMADA') && (
            <button
              disabled={salvando}
              onClick={cancelar}
              className="rounded-xl border border-amber-500/30 px-4 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-500/10 transition-colors"
            >
              Cancelar reserva
            </button>
          )}

          {/* Excluir permanentemente */}
          <button
            disabled={salvando}
            onClick={() => setConfirmandoExclusao(true)}
            className="rounded-xl border border-rose-500/30 px-4 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors ml-auto"
          >
            Excluir Reserva
          </button>
        </div>

        {/* Formulário de edição (Alterar) */}
        {editando && (
          <form onSubmit={editar} className="grid gap-4 sm:grid-cols-2 border-t border-slate-700 pt-5">
            <label className="block">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Usuário *</span>
              <select
                name="usuarioId"
                defaultValue={reserva.usuarioId}
                className="mt-1.5 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
              >
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Espaço *</span>
              <select
                name="espacoId"
                defaultValue={reserva.espacoId}
                className="mt-1.5 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
              >
                {espacos.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Data *</span>
              <input
                name="data"
                type="date"
                defaultValue={reserva.data}
                className="mt-1.5 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Horário Início *</span>
              <input
                name="horarioInicio"
                type="time"
                defaultValue={reserva.horarioInicio}
                className="mt-1.5 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Horário Fim *</span>
              <input
                name="horarioFim"
                type="time"
                defaultValue={reserva.horarioFim}
                className="mt-1.5 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
              />
            </label>
            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button
                type="submit"
                disabled={salvando}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
