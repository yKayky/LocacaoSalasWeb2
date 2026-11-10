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
import { AdminRoleGuard } from '../../../auth/admin-role.guard';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { CreateUsuarioUseCase } from '../../application/use-cases/create-usuario.use-case';
import { FindAllUsuariosUseCase } from '../../application/use-cases/find-all-usuarios.use-case';
import { FindUsuarioByIdUseCase } from '../../application/use-cases/find-usuario-by-id.use-case';
import { UpdateUsuarioUseCase } from '../../application/use-cases/update-usuario.use-case';
import { DeleteUsuarioUseCase } from '../../application/use-cases/delete-usuario.use-case';

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
  async findAll() {
    return await this.findAllUsuariosUseCase.execute();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.findUsuarioByIdUseCase.execute(id);
  }

  @Post()
  @UseGuards(AuthSessionGuard, AdminRoleGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUsuarioDto) {
    return await this.createUsuarioUseCase.execute(dto);
  }

  @Patch(':id')
  @UseGuards(AuthSessionGuard, AdminRoleGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
  ) {
    return await this.updateUsuarioUseCase.execute(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthSessionGuard, AdminRoleGuard)
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.deleteUsuarioUseCase.execute(id);
  }
}
