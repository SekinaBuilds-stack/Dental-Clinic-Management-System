import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { ApproveUserDto, CreateUserDto, SetStatusDto } from './dto/users.dto';
import { ROLES, ROLE_PERMISSIONS } from './roles.config';

const pipe = new ValidationPipe({ whitelist: true });

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('admin:users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('roles')
  roles() {
    return ROLES.map((name) => ({ name, permissions: ROLE_PERMISSIONS[name] }));
  }

  @Get()
  list(@Query('status') status?: string) {
    return this.users.list(status);
  }

  @Post()
  create(@Body(pipe) dto: CreateUserDto, @Request() req: any) {
    return this.users.createByAdmin(dto, req.user.userId);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body(pipe) dto: ApproveUserDto, @Request() req: any) {
    return this.users.approve(id, dto.role, req.user.userId);
  }

  @Patch(':id/role')
  setRole(@Param('id') id: string, @Body(pipe) dto: ApproveUserDto, @Request() req: any) {
    return this.users.setRole(id, dto.role, req.user.userId);
  }

  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body(pipe) dto: SetStatusDto, @Request() req: any) {
    return this.users.setStatus(id, dto.status, req.user.userId);
  }
}
