import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Espaco } from '../../domain/entities/espaco.entity';
import { EspacoRepository } from '../../domain/repositories/espaco.repository';

@Injectable()
export class EspacoPrismaRepository implements EspacoRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(record: any): Espaco {
    return new Espaco({ ...record, valorPorHora: Number(record.valorPorHora) });
  }

  async findAll(contaId: number): Promise<Espaco[]> {
    const espacos = await this.prisma.espaco.findMany({ where: { contaId }, orderBy: { id: 'asc' } });
    return espacos.map((espaco) => this.toEntity(espaco));
  }

  async findById(id: number, contaId: number): Promise<Espaco | null> {
    const espaco = await this.prisma.espaco.findFirst({ where: { id, contaId } });
    return espaco ? this.toEntity(espaco) : null;
  }

  async create(data: Omit<Espaco, 'id'>): Promise<Espaco> {
    const espaco = await this.prisma.espaco.create({ data });
    return this.toEntity(espaco);
  }

  async update(id: number, data: Partial<Omit<Espaco, 'id' | 'contaId'>>, contaId: number): Promise<Espaco | null> {
    const result = await this.prisma.espaco.updateMany({ where: { id, contaId }, data });
    if (result.count === 0) return null;
    return this.findById(id, contaId);
  }

  async delete(id: number, contaId: number): Promise<boolean> {
    const result = await this.prisma.espaco.deleteMany({ where: { id, contaId } });
    return result.count > 0;
  }
}
