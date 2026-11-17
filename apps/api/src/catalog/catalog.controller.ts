import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  // Products
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm' })
  @Get('products')
  getProducts(@Query() query: any) {
    return this.catalogService.getProducts({
      categoryId: query.categoryId,
      search: query.q,
      isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
    });
  }

  @ApiOperation({ summary: 'Chi tiết sản phẩm' })
  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.catalogService.getProduct(id);
  }

  @ApiOperation({ summary: 'Tạo sản phẩm mới' })
  @Post('products')
  createProduct(@Body() body: any) {
    return this.catalogService.createProduct(body);
  }

  @ApiOperation({ summary: 'Cập nhật sản phẩm' })
  @Put('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: any) {
    return this.catalogService.updateProduct(id, body);
  }

  @ApiOperation({ summary: 'Xóa / ngừng kinh doanh sản phẩm' })
  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.catalogService.deleteProduct(id);
  }

  // Categories
  @ApiOperation({ summary: 'Danh mục nhóm hàng' })
  @Get('product-categories')
  getCategories() {
    return this.catalogService.getCategories();
  }

  @ApiOperation({ summary: 'Tạo nhóm hàng' })
  @Post('product-categories')
  createCategory(@Body() body: any) {
    return this.catalogService.createCategory(body);
  }

  @ApiOperation({ summary: 'Cập nhật nhóm hàng' })
  @Put('product-categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: any) {
    return this.catalogService.updateCategory(id, body);
  }

  // Price lists
  @ApiOperation({ summary: 'Bảng giá' })
  @Get('price-lists')
  getPriceLists() {
    return this.catalogService.getPriceLists();
  }

  @ApiOperation({ summary: 'Tạo bảng giá' })
  @Post('price-lists')
  createPriceList(@Body() body: any) {
    return this.catalogService.createPriceList(body);
  }

  // Warehouses
  @ApiOperation({ summary: 'Danh sách kho bãi' })
  @Get('warehouses')
  getWarehouses() {
    return this.catalogService.getWarehouses();
  }

  @ApiOperation({ summary: 'Tạo kho mới' })
  @Post('warehouses')
  createWarehouse(@Body() body: any) {
    return this.catalogService.createWarehouse(body);
  }

  @ApiOperation({ summary: 'Cập nhật kho' })
  @Put('warehouses/:id')
  updateWarehouse(@Param('id') id: string, @Body() body: any) {
    return this.catalogService.updateWarehouse(id, body);
  }
}
