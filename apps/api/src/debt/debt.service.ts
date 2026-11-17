import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DebtService {
  constructor(private prisma: PrismaService) {}

  async getCustomerDebts() {
    return this.prisma.customer.findMany({
      where: { currentDebt: { gt: 0 } },
      include: { group: true },
      orderBy: { currentDebt: 'desc' },
    });
  }

  async getSupplierDebts() {
    return this.prisma.supplier.findMany({
      where: { currentDebt: { gt: 0 } },
      orderBy: { currentDebt: 'desc' },
    });
  }

  async getAgingReport() {
    const unpaidOrders = await this.prisma.salesOrder.findMany({
      where: {
        paymentStatus: { in: ['UNPAID', 'PARTIAL'] },
        status: { notIn: ['CANCELLED', 'DRAFT'] },
      },
      include: { customer: true },
      orderBy: { orderDate: 'asc' },
    });

    const now = new Date();
    const buckets = {
      under30: 0,
      days31to60: 0,
      days61to90: 0,
      over90: 0,
    };

    const customerMap: Record<string, any> = {};

    for (const order of unpaidOrders) {
      const remaining = Number(order.total) - Number(order.paidAmount);
      const diffTime = Math.abs(now.getTime() - new Date(order.orderDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let bucket: 'under30' | 'days31to60' | 'days61to90' | 'over90' = 'under30';
      if (diffDays <= 30) {
        buckets.under30 += remaining;
        bucket = 'under30';
      } else if (diffDays <= 60) {
        buckets.days31to60 += remaining;
        bucket = 'days31to60';
      } else if (diffDays <= 90) {
        buckets.days61to90 += remaining;
        bucket = 'days61to90';
      } else {
        buckets.over90 += remaining;
        bucket = 'over90';
      }

      if (!customerMap[order.customerId]) {
        customerMap[order.customerId] = {
          customerId: order.customerId,
          customerCode: order.customer.code,
          customerName: order.customer.name,
          phone: order.customer.phone,
          creditLimit: Number(order.customer.creditLimit),
          totalDebt: 0,
          under30: 0,
          days31to60: 0,
          days61to90: 0,
          over90: 0,
        };
      }

      customerMap[order.customerId].totalDebt += remaining;
      customerMap[order.customerId][bucket] += remaining;
    }

    return {
      summary: buckets,
      customers: Object.values(customerMap),
    };
  }

  async getStatement(partnerType: 'CUSTOMER' | 'SUPPLIER', partnerId: string, from?: string, to?: string) {
    const where: any = {
      partnerType,
      partnerId,
    };

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const ledgers = await this.prisma.debtLedger.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    // Opening balance calculation
    let openingBalance = 0;
    if (from) {
      const prior = await this.prisma.debtLedger.findMany({
        where: {
          partnerType,
          partnerId,
          createdAt: { lt: new Date(from) },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });
      if (prior.length) {
        openingBalance = Number(prior[0].balanceAfter);
      }
    }

    const totalDebit = ledgers.reduce((sum, l) => sum + Number(l.debit), 0);
    const totalCredit = ledgers.reduce((sum, l) => sum + Number(l.credit), 0);
    const closingBalance = openingBalance + totalDebit - totalCredit;

    return {
      openingBalance,
      totalDebit,
      totalCredit,
      closingBalance,
      transactions: ledgers,
    };
  }
}

