import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DebtService } from './debt.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Debt (Quản lý công nợ & Tuổi nợ)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('debts')
export class DebtController {
  constructor(private debtService: DebtService) {}

  @ApiOperation({ summary: 'Danh sách công nợ phải thu khách hàng' })
  @Get('customers')
  getCustomerDebts() {
    return this.debtService.getCustomerDebts();
  }

  @ApiOperation({ summary: 'Danh sách công nợ phải trả nhà cung cấp' })
  @Get('suppliers')
  getSupplierDebts() {
    return this.debtService.getSupplierDebts();
  }

  @ApiOperation({ summary: 'Báo cáo phân tích tuổi nợ (0-30, 31-60, 61-90, >90 ngày)' })
  @Get('aging')
  getAgingReport() {
    return this.debtService.getAgingReport();
  }

  @ApiOperation({ summary: 'Sao kê công nợ đối tác theo kỳ' })
  @Get(':partnerType/:id/statement')
  getStatement(
    @Param('partnerType') partnerType: 'CUSTOMER' | 'SUPPLIER',
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.debtService.getStatement(partnerType.toUpperCase() as any, id, from, to);
  }
}

