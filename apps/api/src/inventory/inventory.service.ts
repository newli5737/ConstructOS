import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getStock(params?: { warehouseId?: string; search?: string; lowStockOnly?: boolean }) {
    const whereProduct: any = { isActive: true };
    if (params?.search) {
      whereProduct.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const products = await this.prisma.product.findMany({
      where: whereProduct,
      include: {
        category: true,
        units: true,
        stockBalances: {
          where: params?.warehouseId ? { warehouseId: params.warehouseId } : undefined,
          include: { warehouse: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = products.map((p) => {
      const totalStock = p.stockBalances.reduce((sum, b) => sum + Number(b.quantity), 0);
      const isLowStock = totalStock <= Number(p.minStock);
      const totalValue = totalStock * Number(p.costPrice);

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category?.name,
        baseUnit: p.baseUnit,
        minStock: Number(p.minStock),
        costPrice: Number(p.costPrice),
        totalStock,
        totalValue,
        isLowStock,
        balances: p.stockBalances.map((b) => ({
          warehouseId: b.warehouseId,
          warehouseName: b.warehouse.name,
          quantity: Number(b.quantity),
        })),
      };
    });

    if (params?.lowStockOnly) {
      return result.filter((r) => r.isLowStock);
    }

    return result;
  }

  async getProductLedger(productId: string, warehouseId?: string) {
    const where: any = { productId };
    if (warehouseId) where.warehouseId = warehouseId;

    return this.prisma.stockMovement.findMany({
      where,
      include: {
        warehouse: true,
        product: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async adjustStock(data: {
    productId: string;
    warehouseId: string;
    actualQuantity: number;
    reason: string;
  }) {
    let balance = await this.prisma.stockBalance.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: data.warehouseId,
          productId: data.productId,
        },
      },
    });

    if (!balance) {
      balance = await this.prisma.stockBalance.create({
        data: {
          warehouseId: data.warehouseId,
          productId: data.productId,
          quantity: 0,
        },
      });
    }

    const currentQty = Number(balance.quantity);
    const diff = data.actualQuantity - currentQty;
    if (diff === 0) return balance;

    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
    });

    return this.prisma.$transaction(async (tx) => {
      const updatedBalance = await tx.stockBalance.update({
        where: { id: balance!.id },
        data: { quantity: data.actualQuantity },
      });

      await tx.stockMovement.create({
        data: {
          productId: data.productId,
          warehouseId: data.warehouseId,
          movementType: 'ADJUST',
          quantity: diff,
          balanceAfter: data.actualQuantity,
          refType: 'STOCK_ADJUSTMENT',
          refId: balance!.id,
          unitCost: product ? Number(product.costPrice) : 0,
          note: `Điều chỉnh kiểm kê: ${data.reason} (Lệch ${diff > 0 ? '+' : ''}${diff})`,
        },
      });

      return updatedBalance;
    });
  }

  async transferStock(data: {
    fromWarehouseId: string;
    toWarehouseId: string;
    productId: string;
    quantity: number;
    note?: string;
  }) {
    if (data.fromWarehouseId === data.toWarehouseId) {
      throw new BadRequestException('Kho xuất và kho nhập không được trùng nhau');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. From warehouse
      let fromBal = await tx.stockBalance.findUnique({
        where: {
          warehouseId_productId: {
            warehouseId: data.fromWarehouseId,
            productId: data.productId,
          },
        },
      });

      if (!fromBal) {
        fromBal = await tx.stockBalance.create({
          data: {
            warehouseId: data.fromWarehouseId,
            productId: data.productId,
            quantity: 0,
          },
        });
      }

      const fromNew = Number(fromBal.quantity) - data.quantity;
      await tx.stockBalance.update({
        where: { id: fromBal.id },
        data: { quantity: fromNew },
      });

      // 2. To warehouse
      let toBal = await tx.stockBalance.findUnique({
        where: {
          warehouseId_productId: {
            warehouseId: data.toWarehouseId,
            productId: data.productId,
          },
        },
      });

      if (!toBal) {
        toBal = await tx.stockBalance.create({
          data: {
            warehouseId: data.toWarehouseId,
            productId: data.productId,
            quantity: 0,
          },
        });
      }

      const toNew = Number(toBal.quantity) + data.quantity;
      await tx.stockBalance.update({
        where: { id: toBal.id },
        data: { quantity: toNew },
      });

      const refId = `TF-${Date.now()}`;
      // Movement OUT
      await tx.stockMovement.create({
        data: {
          productId: data.productId,
          warehouseId: data.fromWarehouseId,
          movementType: 'TRANSFER_OUT',
          quantity: -data.quantity,
          balanceAfter: fromNew,
          refType: 'STOCK_TRANSFER',
          refId,
          note: `Chuyển sang kho đích. ${data.note || ''}`,
        },
      });

      // Movement IN
      await tx.stockMovement.create({
        data: {
          productId: data.productId,
          warehouseId: data.toWarehouseId,
          movementType: 'TRANSFER_IN',
          quantity: data.quantity,
          balanceAfter: toNew,
          refType: 'STOCK_TRANSFER',
          refId,
          note: `Nhận từ kho xuất. ${data.note || ''}`,
        },
      });

      return { success: true, refId };
    });
  }
}
