'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { AuthUser, entrar, registrar, sair, usuarioAtual } from '@/lib/api';

export default function LoginPage() {
  const [modoCadastro, setModoCadastro] = useState(false);
  const [usuario, setUsuario] = useState<AuthUser | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    usuarioAtual().then(setUsuario).catch(() => setUsuario(null));
  }, []);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const dados = new FormData(event.currentTarget);
    setErro('');
    setCarregando(true);
    try {
      const credenciais = {
        email: String(dados.get('email')),
        senha: String(dados.get('senha')),
      };
      const autenticado = modoCadastro
        ? await registrar({ ...credenciais, nome: String(dados.get('nome')) })
        : await entrar(credenciais);
      setUsuario(autenticado);
      // A full navigation reloads the provider's account-specific data after login.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/reservas');
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível autenticar.');
    } finally {
      setCarregando(false);
    }
  }

  async function encerrarSessao() {
    setErro('');
    setCarregando(true);
    try {
      await sair();
      setUsuario(null);
      window.location.reload();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível sair.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-6 rounded-2xl border border-slate-700 bg-slate-800/50 p-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Conta do CoworkSpace</h1>
        <p className="mt-2 text-sm text-slate-400">
          Entre para criar e gerenciar reservas com permissões vinculadas à sua conta.
        </p>
      </div>

      {usuario ? (
        <div className="space-y-4">
          <p className="text-slate-200">Conectado como {usuario.nome} ({usuario.papel}).</p>
          {erro && <p role="alert" className="text-sm text-rose-400">{erro}</p>}
          <button disabled={carregando} onClick={encerrarSessao} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            Sair
          </button>
          <Link href="/reservas" className="ml-3 text-sm text-indigo-300">Voltar às reservas</Link>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          {modoCadastro && (
            <label className="block space-y-1 text-sm text-slate-300">
              Nome
              <input name="nome" required minLength={2} maxLength={150} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2" />
            </label>
          )}
          <label className="block space-y-1 text-sm text-slate-300">
            E-mail
            <input name="email" type="email" required maxLength={254} autoComplete="email" className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2" />
          </label>
          <label className="block space-y-1 text-sm text-slate-300">
            Senha
            <input name="senha" type="password" required minLength={modoCadastro ? 12 : 1} maxLength={200} autoComplete={modoCadastro ? 'new-password' : 'current-password'} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2" />
          </label>
          {erro && <p role="alert" className="text-sm text-rose-400">{erro}</p>}
          <button disabled={carregando} className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50">
            {carregando ? 'Aguarde...' : modoCadastro ? 'Criar conta' : 'Entrar'}
          </button>
          <button type="button" onClick={() => { setErro(''); setModoCadastro(!modoCadastro); }} className="w-full text-sm text-indigo-300">
            {modoCadastro ? 'Já tenho uma conta' : 'Criar uma conta'}
          </button>
        </form>
      )}
    </main>
  );
}
