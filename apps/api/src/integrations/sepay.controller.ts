import { Controller, Post, Body, Headers, Get, UseGuards } from '@nestjs/common';
import { SepayService } from './sepay.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Integrations (SePay / VietQR)')
@Controller('integrations')
export class SepayController {
  constructor(private sepayService: SepayService) {}

  @ApiOperation({ summary: 'Webhook nhận thông báo thanh toán SePay' })
  @Post('sepay/webhook')
  handleWebhook(@Body() payload: any, @Headers('authorization') authHeader?: string) {
    return this.sepayService.handleWebhook(payload, authHeader);
  }

  @ApiOperation({ summary: 'Lịch sử giao dịch ngân hàng đã nhận' })
  @UseGuards(JwtAuthGuard)
  @Get('bank-transactions')
  getTransactions() {
    return this.sepayService.getTransactions();
  }
}

