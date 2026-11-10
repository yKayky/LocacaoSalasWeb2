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
import { CreateEspacoDto } from '../dto/create-espaco.dto';
import { UpdateEspacoDto } from '../dto/update-espaco.dto';
import { CreateEspacoUseCase } from '../../application/use-cases/create-espaco.use-case';
import { FindAllEspacosUseCase } from '../../application/use-cases/find-all-espacos.use-case';
import { FindEspacoByIdUseCase } from '../../application/use-cases/find-espaco-by-id.use-case';
import { UpdateEspacoUseCase } from '../../application/use-cases/update-espaco.use-case';
import { DeleteEspacoUseCase } from '../../application/use-cases/delete-espaco.use-case';

@Controller('espacos')
export class EspacosController {
  constructor(
    private readonly findAllEspacosUseCase: FindAllEspacosUseCase,
    private readonly findEspacoByIdUseCase: FindEspacoByIdUseCase,
    private readonly createEspacoUseCase: CreateEspacoUseCase,
    private readonly updateEspacoUseCase: UpdateEspacoUseCase,
    private readonly deleteEspacoUseCase: DeleteEspacoUseCase,
  ) {}

  @Get()
  async findAll() {
    return await this.findAllEspacosUseCase.execute();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.findEspacoByIdUseCase.execute(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEspacoDto) {
    return await this.createEspacoUseCase.execute(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEspacoDto,
  ) {
    return await this.updateEspacoUseCase.execute(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.deleteEspacoUseCase.execute(id);
  }
}
