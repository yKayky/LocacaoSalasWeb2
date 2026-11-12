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
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { CreateUsuarioUseCase } from '../../application/use-cases/create-usuario.use-case';
import { FindAllUsuariosUseCase } from '../../application/use-cases/find-all-usuarios.use-case';
import { FindUsuarioByIdUseCase } from '../../application/use-cases/find-usuario-by-id.use-case';
import { UpdateUsuarioUseCase } from '../../application/use-cases/update-usuario.use-case';
import { DeleteUsuarioUseCase } from '../../application/use-cases/delete-usuario.use-case';

@UseGuards(AuthSessionGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly findAllUsuariosUseCase: FindAllUsuariosUseCase,
    private readonly findUsuarioByIdUseCase: FindUsuarioByIdUseCase,
    private readonly createUsuarioUseCase: CreateUsuarioUseCase,
    private readonly updateUsuarioUseCase: UpdateUsuarioUseCase,
    private readonly deleteUsuarioUseCase: DeleteUsuarioUseCase,
  ) {}

  @Get()
  async findAll(@CurrentUser() actor: AuthenticatedUser) {
    return await this.findAllUsuariosUseCase.execute(actor.id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: AuthenticatedUser) {
    return await this.findUsuarioByIdUseCase.execute(id, actor.id);
  }

  @Post()
  @UseGuards(AuthSessionGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUsuarioDto, @CurrentUser() actor: AuthenticatedUser) {
    return await this.createUsuarioUseCase.execute(dto, actor.id);
  }

  @Patch(':id')
  @UseGuards(AuthSessionGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return await this.updateUsuarioUseCase.execute(id, dto, actor.id);
  }

  @Delete(':id')
  @UseGuards(AuthSessionGuard)
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: AuthenticatedUser) {
    return await this.deleteUsuarioUseCase.execute(id, actor.id);
  }
}
