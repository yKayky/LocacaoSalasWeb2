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
  UseGuards,
} from '@nestjs/common';
import { AuthSessionGuard } from '../../../auth/auth-session.guard';
import { CurrentUser } from '../../../auth/current-user.decorator';
import type { AuthenticatedUser } from '../../../auth/authenticated-user';
import { CreateEspacoDto } from '../dto/create-espaco.dto';
import { UpdateEspacoDto } from '../dto/update-espaco.dto';
import { CreateEspacoUseCase } from '../../application/use-cases/create-espaco.use-case';
import { FindAllEspacosUseCase } from '../../application/use-cases/find-all-espacos.use-case';
import { FindEspacoByIdUseCase } from '../../application/use-cases/find-espaco-by-id.use-case';
import { UpdateEspacoUseCase } from '../../application/use-cases/update-espaco.use-case';
import { DeleteEspacoUseCase } from '../../application/use-cases/delete-espaco.use-case';

@UseGuards(AuthSessionGuard)
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
  async findAll(@CurrentUser() actor: AuthenticatedUser) {
    return await this.findAllEspacosUseCase.execute(actor.id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: AuthenticatedUser) {
    return await this.findEspacoByIdUseCase.execute(id, actor.id);
  }

  @Post()
  @UseGuards(AuthSessionGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEspacoDto, @CurrentUser() actor: AuthenticatedUser) {
    return await this.createEspacoUseCase.execute(dto, actor.id);
  }

  @Patch(':id')
  @UseGuards(AuthSessionGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEspacoDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return await this.updateEspacoUseCase.execute(id, dto, actor.id);
  }

  @Delete(':id')
  @UseGuards(AuthSessionGuard)
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: AuthenticatedUser) {
    return await this.deleteEspacoUseCase.execute(id, actor.id);
  }
}
