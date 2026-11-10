import { Injectable } from '@nestjs/common';
import { Espaco } from '../../domain/entities/espaco.entity';
import { EspacoRepository } from '../../domain/repositories/espaco.repository';

@Injectable()
export class InMemoryEspacoRepository implements EspacoRepository {
  private espacos: Espaco[] = [
    new Espaco({
      id: 1,
      nome: 'Sala de Reunião Alpha',
      descricao: 'Equipada com Smart TV 65", quadro branco e videoconferência',
      capacidade: 8,
      localizacao: 'Bloco A - 2º Andar',
      valorPorHora: 65.0,
    }),
    new Espaco({
      id: 2,
      nome: 'Mesa Privativa Coworking',
      descricao: 'Estação individual com monitor extra e tomada dedicada',
      capacidade: 1,
      localizacao: 'Salão Principal',
      valorPorHora: 25.0,
    }),
    new Espaco({
      id: 3,
      nome: 'Auditório Beta',
      descricao: 'Auditório com sistema de áudio integrado e projetor laser',
      capacidade: 30,
      localizacao: 'Bloco B - Térreo',
      valorPorHora: 150.0,
    }),
    new Espaco({
      id: 4,
      nome: 'Sala Executiva Diretoria',
      descricao: 'Sala para reuniões executivas e assinaturas de contratos',
      capacidade: 6,
      localizacao: 'Bloco A - 3º Andar',
      valorPorHora: 90.0,
    }),
  ];

  findAll(): Promise<Espaco[]> {
    return Promise.resolve([...this.espacos]);
  }

  findById(id: number): Promise<Espaco | null> {
    const espaco = this.espacos.find((item) => item.id === id);
    return Promise.resolve(espaco ? { ...espaco } : null);
  }

  create(data: Omit<Espaco, 'id'>): Promise<Espaco> {
    const id = this.espacos.reduce((maior, item) => Math.max(maior, item.id), 0) + 1;
    const novo = new Espaco({ id, ...data });
    this.espacos.push(novo);
    return Promise.resolve({ ...novo });
  }

  update(id: number, data: Partial<Omit<Espaco, 'id'>>): Promise<Espaco | null> {
    const index = this.espacos.findIndex((item) => item.id === id);
    if (index === -1) return Promise.resolve(null);

    const atual = this.espacos[index];
    const atualizado = new Espaco({
      id: atual.id,
      nome: data.nome ?? atual.nome,
      descricao: data.descricao ?? atual.descricao,
      capacidade: data.capacidade ?? atual.capacidade,
      localizacao: data.localizacao ?? atual.localizacao,
      valorPorHora: data.valorPorHora ?? atual.valorPorHora,
    });

    this.espacos[index] = atualizado;
    return Promise.resolve({ ...atualizado });
  }

  delete(id: number): Promise<boolean> {
    const index = this.espacos.findIndex((item) => item.id === id);
    if (index === -1) return Promise.resolve(false);
    this.espacos.splice(index, 1);
    return Promise.resolve(true);
  }
}
