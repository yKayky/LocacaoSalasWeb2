import { Reserva } from '../entities/reserva.entity';

export abstract class ReservaRepository {
  abstract findAll(): Promise<Reserva[]> | Reserva[];
  abstract findById(id: number): Promise<Reserva | null> | Reserva | null;
  abstract create(data: Omit<Reserva, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Reserva> | Reserva;
  abstract update(id: number, data: Partial<Reserva>): Promise<Reserva | null> | Reserva | null;
  abstract delete(id: number): Promise<boolean> | boolean;
}
