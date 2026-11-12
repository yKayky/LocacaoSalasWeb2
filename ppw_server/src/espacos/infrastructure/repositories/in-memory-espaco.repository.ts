import { Injectable } from '@nestjs/common';
import { Espaco } from '../../domain/entities/espaco.entity';
import { EspacoRepository } from '../../domain/repositories/espaco.repository';

@Injectable()
export class InMemoryEspacoRepository implements EspacoRepository {
  private espacos: Espaco[] = [];

  findAll(contaId: number): Promise<Espaco[]> {
    return Promise.resolve(this.espacos.filter((item) => item.contaId === contaId).map((item) => ({ ...item })));
  }

  findById(id: number, contaId: number): Promise<Espaco | null> {
    const espaco = this.espacos.find((item) => item.id === id && item.contaId === contaId);
    return Promise.resolve(espaco ? { ...espaco } : null);
  }

  create(data: Omit<Espaco, 'id'>): Promise<Espaco> {
    const id = this.espacos.reduce((maior, item) => Math.max(maior, item.id), 0) + 1;
    const novo = new Espaco({ id, ...data });
    this.espacos.push(novo);
    return Promise.resolve({ ...novo });
  }

  update(id: number, data: Partial<Omit<Espaco, 'id' | 'contaId'>>, contaId: number): Promise<Espaco | null> {
    const index = this.espacos.findIndex((item) => item.id === id && item.contaId === contaId);
    if (index === -1) return Promise.resolve(null);

    const atual = this.espacos[index];
    const atualizado = new Espaco({
      id: atual.id,
      contaId: atual.contaId,
      nome: data.nome ?? atual.nome,
      descricao: data.descricao ?? atual.descricao,
      capacidade: data.capacidade ?? atual.capacidade,
      localizacao: data.localizacao ?? atual.localizacao,
      valorPorHora: data.valorPorHora ?? atual.valorPorHora,
    });

    this.espacos[index] = atualizado;
    return Promise.resolve({ ...atualizado });
  }

  delete(id: number, contaId: number): Promise<boolean> {
    const index = this.espacos.findIndex((item) => item.id === id && item.contaId === contaId);
    if (index === -1) return Promise.resolve(false);
    this.espacos.splice(index, 1);
    return Promise.resolve(true);
  }
}
