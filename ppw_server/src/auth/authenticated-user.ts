import type { PapelUsuario } from '@prisma/client';

export interface AuthenticatedUser {
  id: number;
  nome: string;
  papel: PapelUsuario;
}
