import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Inventory (Quản lý kho & Thẻ kho)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stock')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @ApiOperation({ summary: 'Xem tồn kho hiện tại (theo kho & cảnh báo dưới mức tối thiểu)' })
  @Get()
  getStock(@Query() query: any) {
    return this.inventoryService.getStock({
      warehouseId: query.warehouseId,
      search: query.q,
      lowStockOnly: query.lowStockOnly === 'true',
    });
  }

  @ApiOperation({ summary: 'Xem thẻ kho (Lịch sử biến động theo sản phẩm)' })
  @Get(':productId/ledger')
  getProductLedger(
    @Param('productId') productId: string,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.inventoryService.getProductLedger(productId, warehouseId);
  }

  @ApiOperation({ summary: 'Điều chỉnh kiểm kê kho' })
  @Post('adjustments')
  adjustStock(@Body() body: any) {
    return this.inventoryService.adjustStock(body);
  }

  @ApiOperation({ summary: 'Phiếu chuyển kho giữa 2 kho' })
  @Post('transfers')
  transferStock(@Body() body: any) {
    return this.inventoryService.transferStock(body);
  }
}

