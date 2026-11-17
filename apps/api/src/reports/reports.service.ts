import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Sales today
    const ordersToday = await this.prisma.salesOrder.findMany({
      where: {
        orderDate: { gte: startOfToday },
        status: { notIn: ['CANCELLED', 'DRAFT'] },
      },
      include: { items: true },
    });
    const todayRevenue = ordersToday.reduce((sum, o) => sum + Number(o.total), 0);

    // Sales this month
    const ordersMonth = await this.prisma.salesOrder.findMany({
      where: {
        orderDate: { gte: startOfMonth },
        status: { notIn: ['CANCELLED', 'DRAFT'] },
      },
      include: { items: true },
    });
    const monthRevenue = ordersMonth.reduce((sum, o) => sum + Number(o.total), 0);

    // Month gross profit
    let monthCost = 0;
    for (const order of ordersMonth) {
      for (const item of order.items) {
        monthCost += Number(item.baseQuantity) * Number(item.costAtSale);
      }
    }
    const monthGrossProfit = monthRevenue - monthCost;

    // Accounts receivable (Phải thu KH)
    const customers = await this.prisma.customer.findMany({
      where: { currentDebt: { gt: 0 } },
    });
    const totalReceivable = customers.reduce((sum, c) => sum + Number(c.currentDebt), 0);

    // Accounts payable (Phải trả NCC)
    const suppliers = await this.prisma.supplier.findMany({
      where: { currentDebt: { gt: 0 } },
    });
    const totalPayable = suppliers.reduce((sum, s) => sum + Number(s.currentDebt), 0);

    // Low stock count
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: { stockBalances: true },
    });
    let lowStockCount = 0;
    let totalInventoryValue = 0;
    for (const p of products) {
      const stock = p.stockBalances.reduce((sum, b) => sum + Number(b.quantity), 0);
      if (stock <= Number(p.minStock)) lowStockCount++;
      totalInventoryValue += stock * Number(p.costPrice);
    }

    // Pending orders (draft or confirmed awaiting delivery)
    const pendingOrdersCount = await this.prisma.salesOrder.count({
      where: { status: { in: ['DRAFT', 'CONFIRMED'] } },
    });

    // 30 Days daily revenue chart
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentOrders = await this.prisma.salesOrder.findMany({
      where: {
        orderDate: { gte: thirtyDaysAgo },
        status: { notIn: ['CANCELLED', 'DRAFT'] },
      },
      orderBy: { orderDate: 'asc' },
    });

    const dailyRevenueMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      dailyRevenueMap[key] = 0;
    }

    for (const ord of recentOrders) {
      const d = new Date(ord.orderDate);
      const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (dailyRevenueMap[key] !== undefined) {
        dailyRevenueMap[key] += Number(ord.total);
      }
    }

    const chart30Days = Object.entries(dailyRevenueMap).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    // Top recent orders
    const latestOrders = await this.prisma.salesOrder.findMany({
      take: 6,
      orderBy: { orderDate: 'desc' },
      include: { customer: true },
    });

    return {
      todayRevenue,
      monthRevenue,
      monthGrossProfit,
      totalReceivable,
      totalPayable,
      lowStockCount,
      totalInventoryValue,
      pendingOrdersCount,
      chart30Days,
      latestOrders,
    };
  }

  async getSalesReport(from?: string, to?: string) {
    const where: any = {
      status: { notIn: ['CANCELLED', 'DRAFT'] },
    };
    if (from || to) {
      where.orderDate = {};
      if (from) where.orderDate.gte = new Date(from);
      if (to) where.orderDate.lte = new Date(to);
    }

    const orders = await this.prisma.salesOrder.findMany({
      where,
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { orderDate: 'desc' },
    });

    return orders;
  }

  async getTopProducts(limit = 10) {
    const items = await this.prisma.salesOrderItem.findMany({
      where: {
        order: { status: { notIn: ['CANCELLED', 'DRAFT'] } },
      },
      include: { product: true },
    });

    const map: Record<string, { sku: string; name: string; baseUnit: string; totalQuantity: number; totalRevenue: number }> = {};
    for (const item of items) {
      if (!map[item.productId]) {
        map[item.productId] = {
          sku: item.product.sku,
          name: item.product.name,
          baseUnit: item.product.baseUnit,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }
      map[item.productId].totalQuantity += Number(item.baseQuantity);
      map[item.productId].totalRevenue += Number(item.lineTotal);
    }

    return Object.values(map)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }
}

