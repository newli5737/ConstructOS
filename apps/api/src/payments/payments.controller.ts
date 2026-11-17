import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Payments (Thu tiền & Chi tiền)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @ApiOperation({ summary: 'Danh sách phiếu thu / phiếu chi' })
  @Get()
  findAll(@Query() query: any) {
    return this.paymentsService.findAll(query);
  }

  @ApiOperation({ summary: 'Tạo phiếu thu / chi (Hỗ trợ phân bổ tự động FIFO theo đơn cũ nhất trước)' })
  @Post()
  create(@Body() body: any) {
    return this.paymentsService.create(body);
  }
}

