import { StatusReserva } from '@/types/reserva';

const estilos: Record<StatusReserva, string> = {
  PENDENTE: 'bg-yellow-500/15 text-yellow-400 ring-1 ring-yellow-500/30',
  CONFIRMADA: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
  EM_ANDAMENTO: 'bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30',
  FINALIZADA: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  CANCELADA: 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30',
};

const rotulos: Record<StatusReserva, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADA: 'Confirmada',
  EM_ANDAMENTO: 'Em andamento',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
};

export function ReservaStatusBadge({ status }: { status?: StatusReserva }) {
  if (!status) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${estilos[status] ?? 'bg-slate-500/15 text-slate-400'}`}>
      {rotulos[status] ?? status}
    </span>
  );
}
