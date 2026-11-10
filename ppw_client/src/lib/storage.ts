import { Reserva } from '@/types/reserva';
const CHAVE_CONSULTAS = 'agenda-coworking-reservas';
export function carregarReservas(): Reserva[] | null {
  if (typeof window === 'undefined') return null;
  const valor = window.localStorage.getItem(CHAVE_CONSULTAS);
  if (!valor) return null;
  try {
    return JSON.parse(valor) as Reserva[];
  } catch {
    return null;
  }
}
export function salvarReservas(reservas: Reserva[]) {
  if (typeof window !== 'undefined') window.localStorage.setItem(CHAVE_CONSULTAS, JSON.stringify(reservas));
}
