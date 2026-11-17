import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalesOrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    status?: SalesOrderStatus;
    paymentStatus?: PaymentStatus;
    customerId?: string;
    search?: string;
    from?: string;
    to?: string;
  }) {
    const where: any = {};
    if (params?.status) where.status = params.status;
    if (params?.paymentStatus) where.paymentStatus = params.paymentStatus;
    if (params?.customerId) where.customerId = params.customerId;
    if (params?.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { customer: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }
    if (params?.from || params?.to) {
      where.orderDate = {};
      if (params.from) where.orderDate.gte = new Date(params.from);
      if (params.to) where.orderDate.lte = new Date(params.to);
    }

    return this.prisma.salesOrder.findMany({
      where,
      include: {
        customer: true,
        site: true,
        salesperson: { select: { id: true, fullName: true, username: true } },
        items: { include: { product: true } },
        deliveries: true,
      },
      orderBy: { orderDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.salesOrder.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: {
        customer: { include: { group: true } },
        site: true,
        salesperson: { select: { id: true, fullName: true } },
        items: {
          include: {
            product: {
              include: { units: true },
            },
          },
        },
        deliveries: {
          include: {
            warehouse: true,
            items: true,
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn bán hàng');
    return order;
  }

  async generateOrderCode(): Promise<string> {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `BH-${yy}${mm}-`;
    const lastOrder = await this.prisma.salesOrder.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
    });
    let seq = 1;
    if (lastOrder) {
      const parts = lastOrder.code.split('-');
      if (parts.length === 3) {
        seq = parseInt(parts[2], 10) + 1;
      }
    }
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  async create(data: any, salespersonId?: string) {
    const code = data.code || (await this.generateOrderCode());
    const items = data.items || [];
    if (!items.length) {
      throw new BadRequestException('Đơn hàng phải có ít nhất 1 sản phẩm');
    }

    // Calculate totals
    let subtotal = 0;
    const mappedItems: any[] = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { units: true },
      });
      if (!product) {
        throw new BadRequestException(`Không tìm thấy sản phẩm ${item.productId}`);
      }

      // Check conversion factor
      let factor = 1;
      if (item.unitName && item.unitName !== product.baseUnit) {
        const u = product.units.find((u) => u.unitName === item.unitName);
        if (u) factor = Number(u.factor);
      }

      const qty = Number(item.quantity);
      const baseQty = qty * factor;
      const unitPrice = Number(item.unitPrice);
      const discountPct = Number(item.discountPct || 0);
      const lineTotal = qty * unitPrice * (1 - discountPct / 100);
      subtotal += lineTotal;

      mappedItems.push({
        productId: product.id,
        unitName: item.unitName || product.baseUnit,
        quantity: qty,
        baseQuantity: baseQty,
        unitPrice: unitPrice,
        discountPct: discountPct,
        lineTotal: lineTotal,
        costAtSale: Number(product.costPrice),
      });
    }

    const discountAmount = Number(data.discountAmount || 0);
    const shippingFee = Number(data.shippingFee || 0);
    const total = subtotal - discountAmount + shippingFee;
    const paidAmount = Number(data.paidAmount || 0);

    let paymentStatus: PaymentStatus = PaymentStatus.UNPAID;
    if (paidAmount >= total) {
      paymentStatus = PaymentStatus.PAID;
    } else if (paidAmount > 0) {
      paymentStatus = PaymentStatus.PARTIAL;
    }

    const order = await this.prisma.salesOrder.create({
      data: {
        code,
        customerId: data.customerId,
        siteId: data.siteId,
        orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.confirmNow ? SalesOrderStatus.CONFIRMED : SalesOrderStatus.DRAFT,
        paymentStatus,
        subtotal,
        discountAmount,
        shippingFee,
        total,
        paidAmount,
        note: data.note,
        salespersonId,
        items: {
          create: mappedItems,
        },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    if (data.confirmNow) {
      await this.processOrderConfirmation(order.id, data.warehouseId, data.allowNegativeStock, data.paymentMethod);
    }

    return this.findOne(order.id);
  }

  async confirmOrder(id: string, options?: { warehouseId?: string; allowNegativeStock?: boolean; paymentMethod?: 'CASH' | 'TRANSFER' }) {
    return this.processOrderConfirmation(id, options?.warehouseId, options?.allowNegativeStock, options?.paymentMethod);
  }

  private async processOrderConfirmation(
    orderId: string,
    warehouseIdOption?: string,
    allowNegativeStock = true,
    paymentMethod: 'CASH' | 'TRANSFER' = 'CASH',
  ) {
    const order = await this.prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.status === SalesOrderStatus.CONFIRMED || order.status === SalesOrderStatus.COMPLETED) {
      return order; // Already confirmed
    }

    // Default warehouse
    let targetWarehouseId = warehouseIdOption;
    if (!targetWarehouseId) {
      const defaultWh = await this.prisma.warehouse.findFirst({
        where: { isDefault: true },
      });
      targetWarehouseId = defaultWh ? defaultWh.id : (await this.prisma.warehouse.findFirst())?.id;
    }

    if (!targetWarehouseId) {
      throw new BadRequestException('Hệ thống chưa có kho bãi');
    }

    // Execute in a robust database transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Check stock & decrement balances
      for (const item of order.items) {
        let balance = await tx.stockBalance.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: targetWarehouseId!,
              productId: item.productId,
            },
          },
        });

        if (!balance) {
          balance = await tx.stockBalance.create({
            data: {
              warehouseId: targetWarehouseId!,
              productId: item.productId,
              quantity: 0,
            },
          });
        }

        const currentQty = Number(balance.quantity);
        const deductQty = Number(item.baseQuantity);
        const newBalance = currentQty - deductQty;

        if (newBalance < 0 && !allowNegativeStock) {
          throw new BadRequestException(
            `Sản phẩm ${item.product.name} tồn kho không đủ (Hiện tồn: ${currentQty}, cần xuất: ${deductQty})`,
          );
        }

        // Update balance
        await tx.stockBalance.update({
          where: { id: balance.id },
          data: { quantity: newBalance },
        });

        // Record stock movement (thẻ kho)
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: targetWarehouseId!,
            movementType: 'SALE_OUT',
            quantity: -deductQty,
            balanceAfter: newBalance,
            refType: 'SALES_ORDER',
            refId: order.id,
            unitCost: item.costAtSale,
            note: `Xuất bán đơn hàng ${order.code}`,
          },
        });
      }

      // 2. Debt Ledger & Customer Current Debt
      const remainingDebt = Number(order.total) - Number(order.paidAmount);
      if (remainingDebt > 0) {
        const newCustomerDebt = Number(order.customer.currentDebt) + remainingDebt;
        await tx.customer.update({
          where: { id: order.customerId },
          data: { currentDebt: newCustomerDebt },
        });

        await tx.debtLedger.create({
          data: {
            partnerType: 'CUSTOMER',
            partnerId: order.customerId,
            refType: 'SALES_ORDER',
            refId: order.id,
            debit: remainingDebt,
            credit: 0,
            balanceAfter: newCustomerDebt,
            note: `Ghi nợ đơn bán hàng ${order.code}`,
          },
        });
      }

      // 3. Payment record if paid amount > 0
      if (Number(order.paidAmount) > 0) {
        const paymentCode = `PT-${order.code.replace('BH-', '')}`;
        const payment = await tx.payment.create({
          data: {
            code: paymentCode,
            type: 'RECEIPT',
            partnerType: 'CUSTOMER',
            partnerId: order.customerId,
            amount: order.paidAmount,
            method: paymentMethod,
            note: `Thu tiền ngay khi bán đơn ${order.code}`,
          },
        });

        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            orderType: 'SALES_ORDER',
            orderId: order.id,
            amount: order.paidAmount,
          },
        });
      }

      // 4. Update order status
      await tx.salesOrder.update({
        where: { id: order.id },
        data: {
          status: SalesOrderStatus.CONFIRMED,
        },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          action: 'CONFIRM_SALES_ORDER',
          entity: 'sales_orders',
          entityId: order.id,
          after: { code: order.code, total: Number(order.total), paid: Number(order.paidAmount) },
        },
      });
    });

    return this.findOne(order.id);
  }

  async cancelOrder(id: string, reason?: string) {
    const order = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: { customer: true, items: true },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    if (order.status === SalesOrderStatus.CANCELLED) {
      return order;
    }

    if (order.status === SalesOrderStatus.CONFIRMED) {
      // Must rollback stock and debt
      await this.prisma.$transaction(async (tx) => {
        // Rollback debt if debt was recorded
        const remainingDebt = Number(order.total) - Number(order.paidAmount);
        if (remainingDebt > 0) {
          const newDebt = Math.max(0, Number(order.customer.currentDebt) - remainingDebt);
          await tx.customer.update({
            where: { id: order.customerId },
            data: { currentDebt: newDebt },
          });

          await tx.debtLedger.create({
            data: {
              partnerType: 'CUSTOMER',
              partnerId: order.customerId,
              refType: 'SALES_ORDER_CANCEL',
              refId: order.id,
              debit: 0,
              credit: remainingDebt,
              balanceAfter: newDebt,
              note: `Hủy đơn bán hàng ${order.code}`,
            },
          });
        }

        // Rollback stock balances
        const defaultWh = await tx.warehouse.findFirst({ where: { isDefault: true } });
        const whId = defaultWh ? defaultWh.id : (await tx.warehouse.findFirst())?.id;

        if (whId) {
          for (const item of order.items) {
            const balance = await tx.stockBalance.findUnique({
              where: {
                warehouseId_productId: {
                  warehouseId: whId,
                  productId: item.productId,
                },
              },
            });
            if (balance) {
              const newQty = Number(balance.quantity) + Number(item.baseQuantity);
              await tx.stockBalance.update({
                where: { id: balance.id },
                data: { quantity: newQty },
              });

              await tx.stockMovement.create({
                data: {
                  productId: item.productId,
                  warehouseId: whId,
                  movementType: 'RETURN_IN',
                  quantity: Number(item.baseQuantity),
                  balanceAfter: newQty,
                  refType: 'SALES_ORDER_CANCEL',
                  refId: order.id,
                  unitCost: item.costAtSale,
                  note: `Hoàn nhập do hủy đơn ${order.code}: ${reason || ''}`,
                },
              });
            }
          }
        }

        await tx.salesOrder.update({
          where: { id },
          data: { status: SalesOrderStatus.CANCELLED, note: `${order.note || ''} [ĐÃ HỦY: ${reason || ''}]` },
        });
      });
    } else {
      await this.prisma.salesOrder.update({
        where: { id },
        data: { status: SalesOrderStatus.CANCELLED },
      });
    }

    return this.findOne(id);
  }

  async createDelivery(orderId: string, data: any) {
    const order = await this.prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const count = await this.prisma.delivery.count();
    const code = `XK-${String(count + 1).padStart(4, '0')}`;

    const delivery = await this.prisma.delivery.create({
      data: {
        code,
        salesOrderId: order.id,
        warehouseId: data.warehouseId,
        receiverName: data.receiverName,
        receiverPhone: data.receiverPhone,
        deliveryAddress: data.deliveryAddress,
        vehiclePlate: data.vehiclePlate,
        driverName: data.driverName,
        note: data.note,
        items: {
          create: (data.items || order.items).map((item: any) => ({
            productId: item.productId,
            unitName: item.unitName,
            quantity: item.quantity,
            baseQuantity: item.baseQuantity || item.quantity,
          })),
        },
      },
      include: { items: true, warehouse: true },
    });

    await this.prisma.salesOrder.update({
      where: { id: orderId },
      data: { status: SalesOrderStatus.DELIVERED },
    });

    return delivery;
  }
}

