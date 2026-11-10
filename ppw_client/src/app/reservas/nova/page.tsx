'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useReservas } from '@/components/reservas/reserva-provider';

export default function NovaReserva() {
  const router = useRouter();
  const { usuarios, espacos, criarReserva, loading } = useReservas();

  const [usuarioId, setUsuarioId] = useState('');
  const [espacoId, setEspacoId] = useState('');
  const [data, setData] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const espaco = espacos.find((item) => item.id === Number(espacoId));

  async function enviar(event: FormEvent) {
    event.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const reserva = await criarReserva({ usuarioId: Number(usuarioId), espacoId: Number(espacoId), data, horarioInicio, horarioFim });
      router.push(`/reservas/${reserva.id}`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível solicitar a reserva.');
    } finally {
      setSalvando(false);
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 animate-pulse">Carregando dados...</div>
      </div>
    );

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/reservas" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </Link>
        <h1 className="text-2xl font-bold text-white">Nova Reserva</h1>
        <p className="mt-1 text-sm text-slate-400">Preencha os dados para solicitar um espaço</p>
      </div>

      <form onSubmit={enviar} className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6 space-y-5">
        {erro && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-rose-400 text-sm">
            {erro}
          </div>
        )}

        <label className="block">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuário</span>
          <select
            required
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            className="mt-1.5 block w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-slate-200 focus:border-indigo-500 outline-none"
          >
            <option value="">Selecione um usuário</option>
            {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Espaço</span>
          <select
            required
            value={espacoId}
            onChange={(e) => setEspacoId(e.target.value)}
            className="mt-1.5 block w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-slate-200 focus:border-indigo-500 outline-none"
          >
            <option value="">Selecione um espaço</option>
            {espacos.map((e) => <option key={e.id} value={e.id}>{e.nome} — {e.descricao}</option>)}
          </select>
        </label>

        {espaco && (
          <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-3 text-sm space-y-1">
            <p className="text-indigo-300 font-medium">{espaco.nome}</p>
            <p className="text-slate-400">{espaco.descricao}</p>
            <div className="flex gap-4 text-slate-400 mt-2">
              <span>👥 {espaco.capacidade} pessoas</span>
              <span>💰 R$ {espaco.valorPorHora.toFixed(2)}/hora</span>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Data</span>
            <input
              required
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="mt-1.5 block w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-slate-200 focus:border-indigo-500 outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Início</span>
            <input
              required
              type="time"
              value={horarioInicio}
              onChange={(e) => setHorarioInicio(e.target.value)}
              className="mt-1.5 block w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-slate-200 focus:border-indigo-500 outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fim</span>
            <input
              required
              type="time"
              value={horarioFim}
              onChange={(e) => setHorarioFim(e.target.value)}
              className="mt-1.5 block w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-slate-200 focus:border-indigo-500 outline-none"
            />
          </label>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={salvando}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-900/30"
          >
            {salvando ? 'Criando reserva...' : 'Solicitar Reserva'}
          </button>
        </div>
      </form>
    </div>
  );
}
