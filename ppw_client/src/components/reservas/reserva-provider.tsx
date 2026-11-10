'use client';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import {
  buscarReservas,
  buscarEspacos,
  buscarUsuarios,
  criarReserva as criarNaApi,
  atualizarReserva as atualizarNaApi,
  transicionarReserva as transicionarNaApi,
  usuarioAtual,
  criarUsuario as criarUsuarioNaApi,
  atualizarUsuario as atualizarUsuarioNaApi,
  excluirUsuario as excluirUsuarioNaApi,
  criarEspaco as criarEspacoNaApi,
  atualizarEspaco as atualizarEspacoNaApi,
  excluirEspaco as excluirEspacoNaApi,
} from '@/lib/api';

import { Reserva, DadosReserva, Espaco, Usuario, StatusReserva } from '@/types/reserva';
import { AuthUser } from '@/lib/api';

type Contexto = {
  reservas: Reserva[];
  usuarios: Usuario[];
  espacos: Espaco[];
  loading: boolean;
  error: string;
  authUser: AuthUser | null;
  criarReserva: (dados: DadosReserva) => Promise<Reserva>;
  editarReserva: (id: number, dados: Partial<Reserva>) => Promise<Reserva>;
  alterarStatus: (id: number, status: StatusReserva, justificativa: string) => Promise<Reserva>;
  adicionarUsuario: (nome: string) => Promise<Usuario>;
  editarUsuario: (id: number, dados: { nome: string }) => Promise<Usuario>;
  excluirUsuario: (id: number) => Promise<void>;
  adicionarEspaco: (dados: Omit<Espaco, 'id'>) => Promise<Espaco>;
  editarEspaco: (id: number, dados: Partial<Omit<Espaco, 'id'>>) => Promise<Espaco>;
  excluirEspaco: (id: number) => Promise<void>;
};

const ReservaContext = createContext<Contexto | null>(null);

export function ReservaProvider({ children }: { children: ReactNode }) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [espacos, setEspacos] = useState<Espaco[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    async function iniciar() {
      try {
        const [catalogoUsuarios, catalogoEspacos, listaReservas] = await Promise.all([
          buscarUsuarios(),
          buscarEspacos(),
          buscarReservas(),
        ]);
        setUsuarios(catalogoUsuarios);
        setEspacos(catalogoEspacos);
        setReservas(listaReservas);
        setAuthUser(await usuarioAtual().catch(() => null));
      } catch (erro) {
        setError(erro instanceof Error ? erro.message : 'Não foi possível carregar os dados.');
      } finally {
        setLoading(false);
      }
    }
    void iniciar();
  }, []);

  // Reservas
  async function criarReserva(dados: DadosReserva) {
    const reserva = await criarNaApi(dados);
    setReservas((prev) => [...prev, reserva]);
    return reserva;
  }

  async function editarReserva(id: number, dados: Partial<Reserva>) {
    const reserva = await atualizarNaApi(id, dados);
    setReservas((prev) => prev.map((item) => (item.id === id ? reserva : item)));
    return reserva;
  }

  async function alterarStatus(id: number, status: StatusReserva, justificativa: string) {
    const acaoPorStatus: Partial<Record<StatusReserva, 'CONFIRMAR' | 'INICIAR' | 'FINALIZAR' | 'CANCELAR'>> = {
      CONFIRMADA: 'CONFIRMAR',
      EM_ANDAMENTO: 'INICIAR',
      FINALIZADA: 'FINALIZAR',
      CANCELADA: 'CANCELAR',
    };
    const acao = acaoPorStatus[status];
    if (!acao) throw new Error('Ação de estado inválida.');
    const reserva = await transicionarNaApi(id, acao, justificativa);
    setReservas((prev) => prev.map((item) => (item.id === id ? reserva : item)));
    return reserva;
  }

  // Usuários
  async function adicionarUsuario(nome: string) {
    const usuario = await criarUsuarioNaApi({ nome });
    setUsuarios((prev) => [...prev, usuario]);
    return usuario;
  }

  async function editarUsuario(id: number, dados: { nome: string }) {
    const usuario = await atualizarUsuarioNaApi(id, dados);
    setUsuarios((prev) => prev.map((item) => (item.id === id ? usuario : item)));
    return usuario;
  }

  async function excluirUsuario(id: number) {
    await excluirUsuarioNaApi(id);
    setUsuarios((prev) => prev.filter((item) => item.id !== id));
  }

  // Espaços
  async function adicionarEspaco(dados: Omit<Espaco, 'id'>) {
    const espaco = await criarEspacoNaApi(dados);
    setEspacos((prev) => [...prev, espaco]);
    return espaco;
  }

  async function editarEspaco(id: number, dados: Partial<Omit<Espaco, 'id'>>) {
    const espaco = await atualizarEspacoNaApi(id, dados);
    setEspacos((prev) => prev.map((item) => (item.id === id ? espaco : item)));
    return espaco;
  }

  async function excluirEspaco(id: number) {
    await excluirEspacoNaApi(id);
    setEspacos((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <ReservaContext.Provider
      value={{
        reservas,
        usuarios,
        espacos,
        loading,
        error,
        authUser,
        criarReserva,
        editarReserva,
        alterarStatus,
        adicionarUsuario,
        editarUsuario,
        excluirUsuario,
        adicionarEspaco,
        editarEspaco,
        excluirEspaco,
      }}
    >
      {children}
    </ReservaContext.Provider>
  );
}

export function useReservas() {
  const contexto = useContext(ReservaContext);
  if (!contexto) throw new Error('useReservas deve ser usado dentro de ReservaProvider.');
  return contexto;
}
