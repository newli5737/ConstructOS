import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartnersService {
  constructor(private prisma: PrismaService) {}

  // ===================== CUSTOMERS =====================
  async getCustomers(params?: { search?: string; groupId?: string; isActive?: boolean }) {
    const where: any = {};
    if (params?.groupId) where.groupId = params.groupId;
    if (params?.isActive !== undefined) where.isActive = params.isActive;
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.customer.findMany({
      where,
      include: {
        group: {
          include: { priceList: true },
        },
        sites: true,
        _count: { select: { salesOrders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCustomer(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        group: {
          include: { priceList: true },
        },
        sites: true,
        salesOrders: {
          take: 10,
          orderBy: { orderDate: 'desc' },
        },
      },
    });
    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng');
    return customer;
  }

  async createCustomer(data: any) {
    // Generate code if not provided
    if (!data.code) {
      const count = await this.prisma.customer.count();
      data.code = `KH-${String(count + 1).padStart(4, '0')}`;
    }

    const { sites, ...customerData } = data;
    return this.prisma.customer.create({
      data: {
        ...customerData,
        sites: sites?.length
          ? {
              create: sites.map((s: any) => ({
                name: s.name,
                address: s.address,
                contact: s.contact,
              })),
            }
          : undefined,
      },
      include: { group: true, sites: true },
    });
  }

  async updateCustomer(id: string, data: any) {
    const { sites, ...customerData } = data;
    return this.prisma.customer.update({
      where: { id },
      data: customerData,
      include: { group: true, sites: true },
    });
  }

  async addCustomerSite(customerId: string, data: any) {
    return this.prisma.customerSite.create({
      data: {
        customerId,
        name: data.name,
        address: data.address,
        contact: data.contact,
      },
    });
  }

  // Import customers with opening balance
  async importCustomers(items: any[]) {
    const created: any[] = [];
    for (const item of items) {
      const count = await this.prisma.customer.count();
      const code = item.code || `KH-${String(count + 1).padStart(4, '0')}`;
      const customer = await this.prisma.customer.create({
        data: {
          code,
          name: item.name,
          phone: item.phone,
          address: item.address,
          creditLimit: item.creditLimit ? Number(item.creditLimit) : 50000000,
          currentDebt: item.initialDebt ? Number(item.initialDebt) : 0,
          note: item.note,
        },
      });

      // If initial debt, record into debt_ledger
      if (item.initialDebt && Number(item.initialDebt) > 0) {
        await this.prisma.debtLedger.create({
          data: {
            partnerType: 'CUSTOMER',
            partnerId: customer.id,
            refType: 'OPENING_BALANCE',
            refId: customer.id,
            debit: Number(item.initialDebt),
            credit: 0,
            balanceAfter: Number(item.initialDebt),
            note: 'Dư nợ đầu kỳ import',
          },
        });
      }
      created.push(customer);
    }
    return { count: created.length, data: created };
  }

  // ===================== SUPPLIERS =====================
  async getSuppliers(params?: { search?: string }) {
    const where: any = { isActive: true };
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { code: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.supplier.findMany({
      where,
      include: {
        _count: { select: { purchaseOrders: true, goodsReceipts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSupplier(data: any) {
    if (!data.code) {
      const count = await this.prisma.supplier.count();
      data.code = `NCC-${String(count + 1).padStart(4, '0')}`;
    }
    return this.prisma.supplier.create({ data });
  }

  async updateSupplier(id: string, data: any) {
    return this.prisma.supplier.update({ where: { id }, data });
  }

  // ===================== CUSTOMER GROUPS =====================
  async getCustomerGroups() {
    return this.prisma.customerGroup.findMany({
      include: {
        priceList: true,
        _count: { select: { customers: true } },
      },
    });
  }
}

