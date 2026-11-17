import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Users & RBAC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Danh sách người dùng' })
  @Get()
  @Roles('ADMIN', 'MANAGER')
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Danh sách vai trò (Roles)' })
  @Get('roles')
  getRoles() {
    return this.usersService.getRoles();
  }

  @ApiOperation({ summary: 'Danh sách quyền hạn (Permissions)' })
  @Get('permissions')
  getPermissions() {
    return this.usersService.getPermissions();
  }

  @ApiOperation({ summary: 'Chi tiết người dùng' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Tạo người dùng mới' })
  @Post()
  @Roles('ADMIN')
  create(@Body() body: any) {
    return this.usersService.create(body);
  }

  @ApiOperation({ summary: 'Cập nhật người dùng' })
  @Put(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }
}

