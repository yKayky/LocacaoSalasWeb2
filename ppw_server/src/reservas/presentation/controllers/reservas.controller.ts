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
  UseGuards,
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
import { AuthSessionGuard } from '../../../auth/auth-session.guard';
import { AuthenticatedUser } from '../../../auth/authenticated-user';
import { CurrentUser } from '../../../auth/current-user.decorator';
import { ReservaPermissaoPolicy } from '../../application/policies/reserva-permissao.policy';

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
  @UseGuards(AuthSessionGuard)
  async findAll(@CurrentUser() actor: AuthenticatedUser) {
    const reservas = await this.findAllReservasUseCase.execute();
    return actor.papel === 'CLIENTE'
      ? reservas.filter((reserva) => reserva.usuarioId === actor.id)
      : reservas;
  }

  @Get(':id')
  @UseGuards(AuthSessionGuard)
  async findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: AuthenticatedUser) {
    const reserva = await this.findReservaByIdUseCase.execute(id);
    ReservaPermissaoPolicy.validarLeitura(actor, reserva.usuarioId);
    return reserva;
  }

  @Get(':id/historico')
  @UseGuards(AuthSessionGuard)
  async historico(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: AuthenticatedUser) {
    const reserva = await this.reservaRepository.findById(id);
    if (!reserva) throw new NotFoundException('Reserva não encontrada.');
    ReservaPermissaoPolicy.validarLeitura(actor, reserva.usuarioId);
    return this.reservaRepository.findHistory(id);
  }

  @Post()
  @UseGuards(AuthSessionGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateReservaDto, @CurrentUser() actor: AuthenticatedUser) {
    return await this.createReservaUseCase.execute(dto, actor);
  }

  @Patch(':id')
  @UseGuards(AuthSessionGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservaDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return await this.updateReservaUseCase.execute(id, dto, actor);
  }

  @Post(':id/acoes')
  @UseGuards(AuthSessionGuard)
  async transicionar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AcaoReservaDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return await this.transicionarReservaUseCase.execute(
      id,
      dto.acao,
      dto.justificativa,
      actor,
    );
  }

}
