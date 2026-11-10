'use client';
import { useState } from 'react';
import { useReservas } from '@/components/reservas/reserva-provider';
import { Usuario } from '@/types/reserva';

export default function PaginaUsuarios() {
  const { usuarios, loading, error, adicionarUsuario, editarUsuario, excluirUsuario } = useReservas();

  // Estados dos formulários
  const [mostrarFormInclusao, setMostrarFormInclusao] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [usuarioExcluindo, setUsuarioExcluindo] = useState<Usuario | null>(null);

  // Campos
  const [nome, setNome] = useState('');
  const [editNome, setEditNome] = useState('');

  // Feedback e busca
  const [busca, setBusca] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 animate-pulse">Carregando usuários...</div>
      </div>
    );
  }

  // Submissão do formulário de inclusão
  async function onSubmitIncluir(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setMensagemErro('');
    setSalvando(true);
    try {
      await adicionarUsuario(nome.trim());
      setNome('');
      setMostrarFormInclusao(false);
    } catch (err) {
      setMensagemErro(err instanceof Error ? err.message : 'Erro ao criar usuário');
    } finally {
      setSalvando(false);
    }
  }

  // Iniciar edição
  function iniciarEdicao(usuario: Usuario) {
    setUsuarioEditando(usuario);
    setEditNome(usuario.nome);
    setMostrarFormInclusao(false);
  }

  // Submissão do formulário de alteração
  async function onSubmitAlterar(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioEditando || !editNome.trim()) return;
    setMensagemErro('');
    setSalvando(true);
    try {
      await editarUsuario(usuarioEditando.id, { nome: editNome.trim() });
      setUsuarioEditando(null);
    } catch (err) {
      setMensagemErro(err instanceof Error ? err.message : 'Erro ao atualizar usuário');
    } finally {
      setSalvando(false);
    }
  }

  // Confirmação de exclusão
  async function confirmarExclusao() {
    if (!usuarioExcluindo) return;
    setMensagemErro('');
    setSalvando(true);
    try {
      await excluirUsuario(usuarioExcluindo.id);
      setUsuarioExcluindo(null);
    } catch (err) {
      setMensagemErro(err instanceof Error ? err.message : 'Erro ao excluir usuário');
    } finally {
      setSalvando(false);
    }
  }

  const usuariosFiltrados = usuarios.filter((u) =>
    u.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuários</h1>
          <p className="mt-1 text-sm text-slate-400">Membros e locatários cadastrados no sistema</p>
        </div>
        <button
          onClick={() => {
            setMostrarFormInclusao(!mostrarFormInclusao);
            setUsuarioEditando(null);
          }}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/30"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adicionar Usuário
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
        <form onSubmit={onSubmitIncluir} className="rounded-2xl bg-slate-800/60 border border-indigo-500/40 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              Novo Usuário (Incluir)
            </h2>
            <button
              type="button"
              onClick={() => setMostrarFormInclusao(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Nome Completo *</span>
            <input
              required
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João Silva"
              className="mt-1.5 block w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 max-w-md"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={salvando}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Adicionar Usuário'}
            </button>
            <button
              type="button"
              onClick={() => setMostrarFormInclusao(false)}
              className="rounded-xl border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Modal / Formulário de Alteração (Alterar) */}
      {usuarioEditando && (
        <form onSubmit={onSubmitAlterar} className="rounded-2xl bg-slate-800/80 border border-amber-500/50 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              Alterar Usuário #{usuarioEditando.id}
            </h2>
            <button
              type="button"
              onClick={() => setUsuarioEditando(null)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Nome Completo *</span>
            <input
              required
              type="text"
              value={editNome}
              onChange={(e) => setEditNome(e.target.value)}
              className="mt-1.5 block w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-amber-400 max-w-md"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={salvando}
              className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar Alteração'}
            </button>
            <button
              type="button"
              onClick={() => setUsuarioEditando(null)}
              className="rounded-xl border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Modal de Confirmação de Exclusão (Excluir) */}
      {usuarioExcluindo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Excluir Usuário</h3>
                <p className="text-xs text-slate-400">Esta operação removerá o cadastro</p>
              </div>
            </div>
            <p className="text-sm text-slate-300">
              Deseja realmente excluir o usuário <strong className="text-white">{usuarioExcluindo.nome}</strong> (#{usuarioExcluindo.id})?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUsuarioExcluindo(null)}
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

      {/* Busca */}
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar usuário por nome..."
          className="w-full rounded-xl bg-slate-800/50 border border-slate-700 pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 outline-none"
        />
      </div>

      {/* Tabela / Lista de Usuários (Listar) */}
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 overflow-hidden shadow-sm">
        <div className="grid grid-cols-[60px_1fr_140px] text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 border-b border-slate-700/50">
          <span>ID</span>
          <span>Nome Completo</span>
          <span className="text-right">Ações</span>
        </div>
        {usuariosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Nenhum usuário cadastrado ou encontrado.
          </div>
        ) : (
          usuariosFiltrados.map((usuario) => (
            <div
              key={usuario.id}
              className="grid grid-cols-[60px_1fr_140px] items-center px-5 py-3.5 border-b border-slate-700/30 last:border-0 hover:bg-slate-700/20 transition-colors"
            >
              <span className="text-xs font-mono text-slate-400">#{usuario.id}</span>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                  {usuario.nome.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-200">{usuario.nome}</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  title="Alterar Usuário"
                  onClick={() => iniciarEdicao(usuario)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-700/50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  title="Excluir Usuário"
                  onClick={() => setUsuarioExcluindo(usuario)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
