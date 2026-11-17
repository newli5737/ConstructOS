import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Reports & Dashboard (Báo cáo & Thống kê)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Dữ liệu tổng quan Dashboard (Doanh thu, Lợi nhuận, Công nợ, Tồn kho, Biểu đồ)' })
  @Get('dashboard')
  getDashboard() {
    return this.reportsService.getDashboard();
  }

  @ApiOperation({ summary: 'Báo cáo doanh thu bán hàng theo kỳ' })
  @Get('sales')
  getSalesReport(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getSalesReport(from, to);
  }

  @ApiOperation({ summary: 'Top sản phẩm bán chạy nhất' })
  @Get('top-products')
  getTopProducts(@Query('limit') limit?: string) {
    return this.reportsService.getTopProducts(limit ? parseInt(limit, 10) : 10);
  }
}

