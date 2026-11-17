import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Purchase (Mua hàng & Nhập kho)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PurchaseController {
  constructor(private purchaseService: PurchaseService) {}

  @ApiOperation({ summary: 'Danh sách đơn đặt hàng mua (PO)' })
  @Get('purchase-orders')
  getPurchaseOrders(@Query() query: any) {
    return this.purchaseService.getPurchaseOrders(query);
  }

  @ApiOperation({ summary: 'Chi tiết đơn đặt hàng mua' })
  @Get('purchase-orders/:id')
  getPurchaseOrder(@Param('id') id: string) {
    return this.purchaseService.getPurchaseOrder(id);
  }

  @ApiOperation({ summary: 'Tạo đơn đặt hàng mua' })
  @Post('purchase-orders')
  createPurchaseOrder(@Body() body: any) {
    return this.purchaseService.createPurchaseOrder(body);
  }

  @ApiOperation({ summary: 'Danh sách phiếu nhập kho (GRN)' })
  @Get('goods-receipts')
  getGoodsReceipts(@Query() query: any) {
    return this.purchaseService.getGoodsReceipts(query);
  }

  @ApiOperation({ summary: 'Tạo phiếu nhập kho (Tự động cập nhật tồn & giá vốn bình quân gia quyền)' })
  @Post('goods-receipts')
  createGoodsReceipt(@Body() body: any) {
    return this.purchaseService.createGoodsReceipt(body);
  }
}

