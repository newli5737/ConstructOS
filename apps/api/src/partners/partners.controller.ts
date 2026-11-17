import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Partners (Customers & Suppliers)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PartnersController {
  constructor(private partnersService: PartnersService) {}

  // Customers
  @ApiOperation({ summary: 'Danh sách khách hàng' })
  @Get('customers')
  getCustomers(@Query() query: any) {
    return this.partnersService.getCustomers({
      search: query.q,
      groupId: query.groupId,
      isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
    });
  }

  @ApiOperation({ summary: 'Chi tiết khách hàng' })
  @Get('customers/:id')
  getCustomer(@Param('id') id: string) {
    return this.partnersService.getCustomer(id);
  }

  @ApiOperation({ summary: 'Tạo khách hàng mới' })
  @Post('customers')
  createCustomer(@Body() body: any) {
    return this.partnersService.createCustomer(body);
  }

  @ApiOperation({ summary: 'Cập nhật khách hàng' })
  @Put('customers/:id')
  updateCustomer(@Param('id') id: string, @Body() body: any) {
    return this.partnersService.updateCustomer(id, body);
  }

  @ApiOperation({ summary: 'Thêm công trình cho khách' })
  @Post('customers/:id/sites')
  addSite(@Param('id') id: string, @Body() body: any) {
    return this.partnersService.addCustomerSite(id, body);
  }

  @ApiOperation({ summary: 'Import Excel danh sách khách hàng & công nợ đầu kỳ' })
  @Post('customers/import')
  importCustomers(@Body() body: { items: any[] }) {
    return this.partnersService.importCustomers(body.items || []);
  }

  // Groups
  @ApiOperation({ summary: 'Danh sách nhóm khách hàng' })
  @Get('customer-groups')
  getCustomerGroups() {
    return this.partnersService.getCustomerGroups();
  }

  // Suppliers
  @ApiOperation({ summary: 'Danh sách nhà cung cấp' })
  @Get('suppliers')
  getSuppliers(@Query() query: any) {
    return this.partnersService.getSuppliers({ search: query.q });
  }

  @ApiOperation({ summary: 'Tạo nhà cung cấp mới' })
  @Post('suppliers')
  createSupplier(@Body() body: any) {
    return this.partnersService.createSupplier(body);
  }

  @ApiOperation({ summary: 'Cập nhật nhà cung cấp' })
  @Put('suppliers/:id')
  updateSupplier(@Param('id') id: string, @Body() body: any) {
    return this.partnersService.updateSupplier(id, body);
  }
}
