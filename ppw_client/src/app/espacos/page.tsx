'use client';
import { useState } from 'react';
import { useReservas } from '@/components/reservas/reserva-provider';
import { Espaco } from '@/types/reserva';

export default function PaginaEspacos() {
  const { espacos, loading, error, adicionarEspaco, editarEspaco, excluirEspaco } = useReservas();

  // Estados de controle de formulários
  const [mostrarFormInclusao, setMostrarFormInclusao] = useState(false);
  const [espacoEditando, setEspacoEditando] = useState<Espaco | null>(null);
  const [espacoExcluindo, setEspacoExcluindo] = useState<Espaco | null>(null);

  // Estados dos campos do formulário de inclusão
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [capacidade, setCapacidade] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [valorPorHora, setValorPorHora] = useState('');

  // Estados dos campos do formulário de edição
  const [editNome, setEditNome] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editCapacidade, setEditCapacidade] = useState('');
  const [editLocalizacao, setEditLocalizacao] = useState('');
  const [editValorPorHora, setEditValorPorHora] = useState('');

  // Estados de feedback e busca
  const [filtroBusca, setFiltroBusca] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 animate-pulse">Carregando espaços...</div>
      </div>
    );
  }

  // Submissão do formulário de inclusão
  async function onSubmitIncluir(e: React.FormEvent) {
    e.preventDefault();
    setMensagemErro('');
    setSalvando(true);
    try {
      await adicionarEspaco({
        nome: nome.trim(),
        descricao: descricao.trim(),
        capacidade: Number(capacidade),
        localizacao: localizacao.trim() || 'Principal',
        valorPorHora: Number(valorPorHora),
      });
      setNome('');
      setDescricao('');
      setCapacidade('');
      setLocalizacao('');
      setValorPorHora('');
      setMostrarFormInclusao(false);
    } catch (err) {
      setMensagemErro(err instanceof Error ? err.message : 'Erro ao cadastrar espaço');
    } finally {
      setSalvando(false);
    }
  }

  // Iniciar edição
  function iniciarEdicao(espaco: Espaco) {
    setEspacoEditando(espaco);
    setEditNome(espaco.nome);
    setEditDescricao(espaco.descricao);
    setEditCapacidade(String(espaco.capacidade));
    setEditLocalizacao(espaco.localizacao || '');
    setEditValorPorHora(String(espaco.valorPorHora));
    setMostrarFormInclusao(false);
  }

  // Submissão do formulário de edição
  async function onSubmitAlterar(e: React.FormEvent) {
    e.preventDefault();
    if (!espacoEditando) return;
    setMensagemErro('');
    setSalvando(true);
    try {
      await editarEspaco(espacoEditando.id, {
        nome: editNome.trim(),
        descricao: editDescricao.trim(),
        capacidade: Number(editCapacidade),
        localizacao: editLocalizacao.trim(),
        valorPorHora: Number(editValorPorHora),
      });
      setEspacoEditando(null);
    } catch (err) {
      setMensagemErro(err instanceof Error ? err.message : 'Erro ao atualizar espaço');
    } finally {
      setSalvando(false);
    }
  }

  // Confirmação de exclusão
  async function confirmarExclusao() {
    if (!espacoExcluindo) return;
    setMensagemErro('');
    setSalvando(true);
    try {
      await excluirEspaco(espacoExcluindo.id);
      setEspacoExcluindo(null);
    } catch (err) {
      setMensagemErro(err instanceof Error ? err.message : 'Erro ao excluir espaço');
    } finally {
      setSalvando(false);
    }
  }

  const espacosFiltrados = espacos.filter((item) => {
    const texto = `${item.nome} ${item.descricao} ${item.localizacao}`.toLowerCase();
    return texto.includes(filtroBusca.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Espaços</h1>
          <p className="mt-1 text-sm text-slate-400">Catálogo de salas e recursos disponíveis para locação</p>
        </div>
        <button
          onClick={() => {
            setMostrarFormInclusao(!mostrarFormInclusao);
            setEspacoEditando(null);
          }}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/30"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Cadastrar Espaço
        </button>
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

      {/* Formulário de Inclusão */}
      {mostrarFormInclusao && (
        <form onSubmit={onSubmitIncluir} className="rounded-2xl bg-slate-800/60 border border-indigo-500/40 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              Novo Espaço (Incluir)
            </h2>
            <button
              type="button"
              onClick={() => setMostrarFormInclusao(false)}
              className="text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nome da Sala / Espaço *</span>
              <input
                required
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Sala de Reunião Alpha"
                className="mt-1.5 block w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Localização / Bloco *</span>
              <input
                required
                type="text"
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
                placeholder="Ex: Bloco A - 2º Andar"
                className="mt-1.5 block w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Descrição dos Recursos *</span>
              <input
                required
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Smart TV 65 polegadas, quadro branco, mesa para 8 pessoas e ar condicionado"
                className="mt-1.5 block w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Capacidade (Pessoas) *</span>
              <input
                required
                type="number"
                min="1"
                value={capacidade}
                onChange={(e) => setCapacidade(e.target.value)}
                placeholder="Ex: 8"
                className="mt-1.5 block w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor por Hora (R$) *</span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={valorPorHora}
                onChange={(e) => setValorPorHora(e.target.value)}
                placeholder="Ex: 60.00"
                className="mt-1.5 block w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500"
              />
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={salvando}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar Novo Espaço'}
            </button>
            <button
              type="button"
              onClick={() => setMostrarFormInclusao(false)}
              className="rounded-xl border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Modal / Formulário de Edição (Alterar) */}
      {espacoEditando && (
        <form onSubmit={onSubmitAlterar} className="rounded-2xl bg-slate-800/80 border border-amber-500/50 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              Alterar Espaço #{espacoEditando.id} - {espacoEditando.nome}
            </h2>
            <button
              type="button"
              onClick={() => setEspacoEditando(null)}
              className="text-slate-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nome *</span>
              <input
                required
                type="text"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                className="mt-1.5 block w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-amber-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Localização *</span>
              <input
                required
                type="text"
                value={editLocalizacao}
                onChange={(e) => setEditLocalizacao(e.target.value)}
                className="mt-1.5 block w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-amber-400"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Descrição *</span>
              <input
                required
                type="text"
                value={editDescricao}
                onChange={(e) => setEditDescricao(e.target.value)}
                className="mt-1.5 block w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-amber-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Capacidade (Pessoas) *</span>
              <input
                required
                type="number"
                min="1"
                value={editCapacidade}
                onChange={(e) => setEditCapacidade(e.target.value)}
                className="mt-1.5 block w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-amber-400"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor por Hora (R$) *</span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={editValorPorHora}
                onChange={(e) => setEditValorPorHora(e.target.value)}
                className="mt-1.5 block w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-amber-400"
              />
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={salvando}
              className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button
              type="button"
              onClick={() => setEspacoEditando(null)}
              className="rounded-xl border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Modal de Confirmação de Exclusão (Excluir) */}
      {espacoExcluindo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Excluir Espaço</h3>
                <p className="text-xs text-slate-400">Esta operação é permanente</p>
              </div>
            </div>
            <p className="text-sm text-slate-300">
              Tem certeza que deseja excluir o espaço <strong className="text-white">{espacoExcluindo.nome}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEspacoExcluindo(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvando}
                onClick={confirmarExclusao}
                className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-500 transition-colors disabled:opacity-50"
              >
                {salvando ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Pesquisa / Filtro */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={filtroBusca}
          onChange={(e) => setFiltroBusca(e.target.value)}
          placeholder="Buscar espaços por nome, descrição ou localização..."
          className="w-full rounded-xl bg-slate-800/50 border border-slate-700 pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 outline-none"
        />
      </div>

      {/* Grid de Espaços (Listar) */}
      {espacosFiltrados.length === 0 ? (
        <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-12 text-center text-slate-400">
          Nenhum espaço encontrado.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {espacosFiltrados.map((espaco) => (
            <div
              key={espaco.id}
              className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5 space-y-4 hover:border-slate-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500">#{espaco.id}</span>
                      {espaco.localizacao && (
                        <span className="rounded-md bg-slate-700/50 px-2 py-0.5 text-xs text-slate-300">
                          {espaco.localizacao}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-white mt-1 text-base">{espaco.nome}</p>
                    <p className="text-sm text-slate-400 mt-1 leading-relaxed">{espaco.descricao}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm pt-4 mt-3 border-t border-slate-700/50">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {espaco.capacidade} pessoas
                  </span>
                  <span className="font-bold text-indigo-400 text-base">
                    R$ {Number(espaco.valorPorHora).toFixed(2)}/h
                  </span>
                </div>
              </div>

              {/* Botões de Ação: Alterar e Excluir */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-700/40">
                <button
                  type="button"
                  onClick={() => iniciarEdicao(espaco)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-700/60 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Alterar
                </button>
                <button
                  type="button"
                  onClick={() => setEspacoExcluindo(espaco)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
