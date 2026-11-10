import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { CreateReservaDto } from '../dto/create-reserva.dto';
import { UpdateReservaDto } from '../dto/update-reserva.dto';
import { CreateReservaUseCase } from '../../application/use-cases/create-reserva.use-case';
import { FindAllReservasUseCase } from '../../application/use-cases/find-all-reservas.use-case';
import { FindReservaByIdUseCase } from '../../application/use-cases/find-reserva-by-id.use-case';
import { UpdateReservaUseCase } from '../../application/use-cases/update-reserva.use-case';
import { TransicionarReservaUseCase } from '../../application/use-cases/transicionar-reserva.use-case';
import { AcaoReservaDto } from '../dto/acao-reserva.dto';
import { ReservaRepository } from '../../domain/repositories/reserva.repository';

@Controller('reservas')
export class ReservasController {
  constructor(
    private readonly findAllReservasUseCase: FindAllReservasUseCase,
    private readonly findReservaByIdUseCase: FindReservaByIdUseCase,
    private readonly createReservaUseCase: CreateReservaUseCase,
    private readonly updateReservaUseCase: UpdateReservaUseCase,
    private readonly transicionarReservaUseCase: TransicionarReservaUseCase,
    private readonly reservaRepository: ReservaRepository,
  ) {}

  @Get()
  async findAll() {
    return await this.findAllReservasUseCase.execute();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.findReservaByIdUseCase.execute(id);
  }

  @Get(':id/historico')
  async historico(@Param('id', ParseIntPipe) id: number) {
    const reserva = await this.reservaRepository.findById(id);
    if (!reserva) throw new NotFoundException('Reserva não encontrada.');
    return this.reservaRepository.findHistory(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateReservaDto) {
    return await this.createReservaUseCase.execute(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservaDto,
  ) {
    return await this.updateReservaUseCase.execute(id, dto);
  }

  @Post(':id/acoes')
  async transicionar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AcaoReservaDto,
  ) {
    return await this.transicionarReservaUseCase.execute(
      id,
      dto.acao,
      dto.justificativa,
      dto.autorId,
    );
  }

}
