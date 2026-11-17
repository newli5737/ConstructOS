import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Sales (Bán hàng & Xuất kho)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales-orders')
export class SalesController {
  constructor(private salesService: SalesService) {}

  @ApiOperation({ summary: 'Danh sách đơn bán hàng' })
  @Get()
  findAll(@Query() query: any) {
    return this.salesService.findAll({
      status: query.status,
      paymentStatus: query.paymentStatus,
      customerId: query.customerId,
      search: query.q,
      from: query.from,
      to: query.to,
    });
  }

  @ApiOperation({ summary: 'Chi tiết đơn bán hàng' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @ApiOperation({ summary: 'Tạo đơn bán hàng (Hỗ trợ bán nhanh POS & lưu nháp)' })
  @Post()
  create(@Body() body: any, @Request() req: any) {
    return this.salesService.create(body, req.user?.id);
  }

  @ApiOperation({ summary: 'Xác nhận đơn bán (Trừ tồn kho & ghi nhận công nợ)' })
  @Post(':id/confirm')
  confirm(@Param('id') id: string, @Body() body: any) {
    return this.salesService.confirmOrder(id, body);
  }

  @ApiOperation({ summary: 'Hủy đơn bán hàng (Đảo bút toán công nợ và hoàn tồn)' })
  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body() body: any) {
    return this.salesService.cancelOrder(id, body.reason);
  }

  @ApiOperation({ summary: 'Tạo phiếu giao hàng / xuất kho' })
  @Post(':id/deliveries')
  createDelivery(@Param('id') id: string, @Body() body: any) {
    return this.salesService.createDelivery(id, body);
  }
}
