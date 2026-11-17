import {
  Controller,
  Post,
  Get,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StorageService, StorageConfig } from './storage.service';

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Tải lên hình ảnh / tài liệu lên Cloudflare R2' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body('folder') folder?: string) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn tệp để tải lên');
    }
    return this.storageService.uploadFile(file, folder || 'products');
  }

  @Get('status')
  @ApiOperation({ summary: 'Lấy trạng thái và cấu hình Cloudflare R2 Storage' })
  async getStatus() {
    const config = await this.storageService.getConfig();
    return {
      isConfigured: Boolean(config.accountId && config.accessKeyId && config.secretAccessKey && config.bucketName),
      accountId: config.accountId ? `${config.accountId.substring(0, 6)}...` : '',
      bucketName: config.bucketName,
      publicDomain: config.publicDomain,
    };
  }

  @Post('config')
  @ApiOperation({ summary: 'Lưu thông tin cấu hình Cloudflare R2 Storage' })
  async saveConfig(@Body() body: Partial<StorageConfig>) {
    return this.storageService.saveConfig(body);
  }

  @Post('test')
  @ApiOperation({ summary: 'Kiểm tra kết nối tới Cloudflare R2 bucket' })
  async testConnection(@Body() body: Partial<StorageConfig>) {
    return this.storageService.testConnection(body);
  }
}
