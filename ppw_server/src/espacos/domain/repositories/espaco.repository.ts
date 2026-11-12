import { Espaco } from '../entities/espaco.entity';

export abstract class EspacoRepository {
  abstract findAll(contaId: number): Promise<Espaco[]> | Espaco[];
  abstract findById(id: number, contaId: number): Promise<Espaco | null> | Espaco | null;
  abstract create(data: Omit<Espaco, 'id'>): Promise<Espaco> | Espaco;
  abstract update(id: number, data: Partial<Omit<Espaco, 'id' | 'contaId'>>, contaId: number): Promise<Espaco | null> | Espaco | null;
  abstract delete(id: number, contaId: number): Promise<boolean> | boolean;
}
