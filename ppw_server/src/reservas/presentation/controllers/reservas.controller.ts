import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateReservaDto } from '../dto/create-reserva.dto';
import { UpdateReservaDto } from '../dto/update-reserva.dto';
import { CreateReservaUseCase } from '../../application/use-cases/create-reserva.use-case';
import { FindAllReservasUseCase } from '../../application/use-cases/find-all-reservas.use-case';
import { FindReservaByIdUseCase } from '../../application/use-cases/find-reserva-by-id.use-case';
import { UpdateReservaUseCase } from '../../application/use-cases/update-reserva.use-case';
import { DeleteReservaUseCase } from '../../application/use-cases/delete-reserva.use-case';

@Controller('reservas')
export class ReservasController {
  constructor(
    private readonly findAllReservasUseCase: FindAllReservasUseCase,
    private readonly findReservaByIdUseCase: FindReservaByIdUseCase,
    private readonly createReservaUseCase: CreateReservaUseCase,
    private readonly updateReservaUseCase: UpdateReservaUseCase,
    private readonly deleteReservaUseCase: DeleteReservaUseCase,
  ) {}

  @Get()
  async findAll() {
    return await this.findAllReservasUseCase.execute();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.findReservaByIdUseCase.execute(id);
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

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.deleteReservaUseCase.execute(id);
  }
}
