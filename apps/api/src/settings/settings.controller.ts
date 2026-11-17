import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Settings (Cài đặt hệ thống)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @ApiOperation({ summary: 'Lấy cấu hình cửa hàng & hệ thống' })
  @Get()
  getAll() {
    return this.settingsService.getAll();
  }

  @ApiOperation({ summary: 'Cập nhật cấu hình cửa hàng' })
  @Put()
  @Roles('ADMIN')
  update(@Body() body: Record<string, string>) {
    return this.settingsService.update(body);
  }
}
