import { Reserva, DadosReserva, Espaco, Usuario } from '@/types/reserva';

const API_URL = 'http://localhost:8000';

export interface AuthUser {
  id: number;
  nome: string;
  papel: 'CLIENTE' | 'OPERADOR' | 'ADMIN';
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

async function requisicao<T>(caminho: string, opcoes?: RequestInit): Promise<T> {
  try {
    const resposta = await fetch(`${API_URL}${caminho}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      ...opcoes,
    });
    if (!resposta.ok) {
      if (resposta.status === 401 && !caminho.startsWith('/auth/')) {
        window.dispatchEvent(new Event('sessao-expirada'));
      }
      const erro = await resposta.json().catch(() => ({}));
      throw new ApiError(
        Array.isArray(erro.message)
          ? erro.message.join(', ')
          : erro.message || 'Não foi possível concluir a solicitação.',
        resposta.status,
      );
    }
    // Para DELETE que pode retornar status 204 ou JSON com mensagem
    const texto = await resposta.text();
    if (!texto) return {} as T;
    return JSON.parse(texto) as T;
  } catch (erro) {
    if (erro instanceof TypeError) {
      throw new Error('Backend indisponível. Verifique se a API NestJS está em execução na porta 8000.');
    }
    throw erro;
  }
}

export const registrar = (dados: { nome: string; email: string; senha: string }) =>
  requisicao<AuthUser>('/auth/registrar', { method: 'POST', body: JSON.stringify(dados) });
export const entrar = (dados: { email: string; senha: string }) =>
  requisicao<AuthUser>('/auth/login', { method: 'POST', body: JSON.stringify(dados) });
export const usuarioAtual = () => requisicao<AuthUser>('/auth/me');
export const sair = () => requisicao<{ success: boolean }>('/auth/logout', { method: 'POST' });

// Reservas
export const buscarReservas = () => requisicao<Reserva[]>('/reservas');
export const buscarReservaPorId = (id: number) => requisicao<Reserva>(`/reservas/${id}`);
export const buscarHistoricoReserva = (id: number) =>
  requisicao<Array<{
    idRegistro: number;
    estadoAnterior: Reserva['status'] | null;
    novoEstado: Reserva['status'];
    autorId: number | null;
    autor: { id: number; nome: string } | null;
    justificativa: string;
    timestamp: string;
  }>>(`/reservas/${id}/historico`);
export const criarReserva = (dados: DadosReserva) =>
  requisicao<Reserva>('/reservas', { method: 'POST', body: JSON.stringify(dados) });
export const atualizarReserva = (
  id: number,
  dados: Partial<DadosReserva>,
) => requisicao<Reserva>(`/reservas/${id}`, { method: 'PATCH', body: JSON.stringify(dados) });
export const transicionarReserva = (
  id: number,
  acao: 'CONFIRMAR' | 'INICIAR' | 'FINALIZAR' | 'CANCELAR',
  justificativa: string,
) => requisicao<Reserva>(`/reservas/${id}/acoes`, {
  method: 'POST',
  body: JSON.stringify({ acao, justificativa }),
});
export const sincronizarReservas = (reservas: Reserva[]) =>
  requisicao<Reserva[]>('/reservas/sincronizar', { method: 'PUT', body: JSON.stringify(reservas) });

// Usuários
export const buscarUsuarios = () => requisicao<Usuario[]>('/usuarios');
export const buscarUsuarioPorId = (id: number) => requisicao<Usuario>(`/usuarios/${id}`);
export const criarUsuario = (dados: Omit<Usuario, 'id'>) =>
  requisicao<Usuario>('/usuarios', { method: 'POST', body: JSON.stringify(dados) });
export const atualizarUsuario = (id: number, dados: Partial<Omit<Usuario, 'id'>>) =>
  requisicao<Usuario>(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(dados) });
export const excluirUsuario = (id: number) =>
  requisicao<{ success: boolean; message: string }>(`/usuarios/${id}`, { method: 'DELETE' });

// Espaços
export const buscarEspacos = () => requisicao<Espaco[]>('/espacos');
export const buscarEspacoPorId = (id: number) => requisicao<Espaco>(`/espacos/${id}`);
export const criarEspaco = (dados: Omit<Espaco, 'id'>) =>
  requisicao<Espaco>('/espacos', { method: 'POST', body: JSON.stringify(dados) });
export const atualizarEspaco = (id: number, dados: Partial<Omit<Espaco, 'id'>>) =>
  requisicao<Espaco>(`/espacos/${id}`, { method: 'PATCH', body: JSON.stringify(dados) });
export const excluirEspaco = (id: number) =>
  requisicao<{ success: boolean; message: string }>(`/espacos/${id}`, { method: 'DELETE' });
