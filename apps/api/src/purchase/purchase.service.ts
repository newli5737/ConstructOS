import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PurchaseOrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class PurchaseService {
  constructor(private prisma: PrismaService) {}

  // ===================== PURCHASE ORDERS =====================
  async getPurchaseOrders(params?: { supplierId?: string; status?: PurchaseOrderStatus }) {
    const where: any = {};
    if (params?.supplierId) where.supplierId = params.supplierId;
    if (params?.status) where.status = params.status;

    return this.prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: { include: { product: true } },
        goodsReceipts: true,
      },
      orderBy: { orderDate: 'desc' },
    });
  }

  async getPurchaseOrder(id: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: {
        supplier: true,
        items: { include: { product: true } },
        goodsReceipts: { include: { warehouse: true } },
      },
    });
    if (!po) throw new NotFoundException('Không tìm thấy đơn đặt hàng');
    return po;
  }

  async createPurchaseOrder(data: any) {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `PO-${yy}${mm}-`;
    const last = await this.prisma.purchaseOrder.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
    });
    let seq = 1;
    if (last) {
      const parts = last.code.split('-');
      if (parts.length === 3) seq = parseInt(parts[2], 10) + 1;
    }
    const code = `${prefix}${String(seq).padStart(4, '0')}`;

    let subtotal = 0;
    const mappedItems = (data.items || []).map((i: any) => {
      const qty = Number(i.quantity);
      const factor = Number(i.factor || 1);
      const baseQty = qty * factor;
      const unitCost = Number(i.unitCost);
      const lineTotal = qty * unitCost;
      subtotal += lineTotal;
      return {
        productId: i.productId,
        unitName: i.unitName,
        quantity: qty,
        baseQuantity: baseQty,
        unitCost,
        lineTotal,
      };
    });

    const discountAmount = Number(data.discountAmount || 0);
    const shippingFee = Number(data.shippingFee || 0);
    const total = subtotal - discountAmount + shippingFee;

    return this.prisma.purchaseOrder.create({
      data: {
        code,
        supplierId: data.supplierId,
        orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: PurchaseOrderStatus.ORDERED,
        subtotal,
        discountAmount,
        shippingFee,
        total,
        note: data.note,
        items: { create: mappedItems },
      },
      include: { supplier: true, items: true },
    });
  }

  // ===================== GOODS RECEIPTS (NHẬP KHO) =====================
  async getGoodsReceipts(params?: { supplierId?: string; warehouseId?: string }) {
    const where: any = {};
    if (params?.supplierId) where.supplierId = params.supplierId;
    if (params?.warehouseId) where.warehouseId = params.warehouseId;

    return this.prisma.goodsReceipt.findMany({
      where,
      include: {
        supplier: true,
        warehouse: true,
        items: { include: { product: true } },
      },
      orderBy: { receiptDate: 'desc' },
    });
  }

  async createGoodsReceipt(data: any) {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `NH-${yy}${mm}-`;
    const last = await this.prisma.goodsReceipt.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
    });
    let seq = 1;
    if (last) {
      const parts = last.code.split('-');
      if (parts.length === 3) seq = parseInt(parts[2], 10) + 1;
    }
    const code = `${prefix}${String(seq).padStart(4, '0')}`;

    const items = data.items || [];
    if (!items.length) {
      throw new BadRequestException('Phiếu nhập phải có ít nhất 1 sản phẩm');
    }

    let total = 0;
    const mappedItems: any[] = [];
    for (const item of items) {
      const qty = Number(item.quantity);
      const factor = Number(item.factor || 1);
      const baseQty = qty * factor;
      const unitCost = Number(item.unitCost);
      const lineTotal = qty * unitCost;
      total += lineTotal;

      mappedItems.push({
        productId: item.productId,
        unitName: item.unitName,
        quantity: qty,
        baseQuantity: baseQty,
        unitCost,
        lineTotal,
      });
    }

    const paidAmount = Number(data.paidAmount || 0);
    let paymentStatus: PaymentStatus = PaymentStatus.UNPAID;
    if (paidAmount >= total) paymentStatus = PaymentStatus.PAID;
    else if (paidAmount > 0) paymentStatus = PaymentStatus.PARTIAL;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Goods Receipt
      const receipt = await tx.goodsReceipt.create({
        data: {
          code,
          purchaseOrderId: data.purchaseOrderId,
          supplierId: data.supplierId,
          warehouseId: data.warehouseId,
          receiptDate: data.receiptDate ? new Date(data.receiptDate) : new Date(),
          paymentStatus,
          total,
          paidAmount,
          note: data.note,
          items: { create: mappedItems },
        },
        include: { supplier: true, warehouse: true, items: true },
      });

      // 2. Update Warehouse stock balances & recalculate weighted average cost price
      for (const item of mappedItems) {
        let balance = await tx.stockBalance.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: data.warehouseId,
              productId: item.productId,
            },
          },
        });

        if (!balance) {
          balance = await tx.stockBalance.create({
            data: {
              warehouseId: data.warehouseId,
              productId: item.productId,
              quantity: 0,
            },
          });
        }

        const oldQty = Math.max(0, Number(balance.quantity));
        const inQty = Number(item.baseQuantity);
        const newQty = Number(balance.quantity) + inQty;

        // Get current cost price
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        const oldCost = product ? Number(product.costPrice) : 0;
        // Cost per base unit = item.unitCost / factor
        const costPerBaseUnit = item.unitCost / (item.baseQuantity / item.quantity);

        // Weighted average formula: (old_qty * old_cost + in_qty * in_cost) / (old_qty + in_qty)
        let newWeightedCost = costPerBaseUnit;
        if (oldQty + inQty > 0) {
          newWeightedCost = (oldQty * oldCost + inQty * costPerBaseUnit) / (oldQty + inQty);
        }

        // Update product cost price
        await tx.product.update({
          where: { id: item.productId },
          data: { costPrice: newWeightedCost },
        });

        // Update warehouse stock balance
        await tx.stockBalance.update({
          where: { id: balance.id },
          data: { quantity: newQty },
        });

        // Stock movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: data.warehouseId,
            movementType: 'PURCHASE_IN',
            quantity: inQty,
            balanceAfter: newQty,
            refType: 'GOODS_RECEIPT',
            refId: receipt.id,
            unitCost: costPerBaseUnit,
            note: `Nhập kho theo phiếu ${receipt.code}`,
          },
        });
      }

      // 3. Record Supplier Debt
      const remainingDebt = total - paidAmount;
      if (remainingDebt > 0) {
        const supplier = await tx.supplier.findUnique({
          where: { id: data.supplierId },
        });
        const currentDebt = supplier ? Number(supplier.currentDebt) : 0;
        const newDebt = currentDebt + remainingDebt;

        await tx.supplier.update({
          where: { id: data.supplierId },
          data: { currentDebt: newDebt },
        });

        await tx.debtLedger.create({
          data: {
            partnerType: 'SUPPLIER',
            partnerId: data.supplierId,
            refType: 'GOODS_RECEIPT',
            refId: receipt.id,
            debit: remainingDebt, // Công nợ phải trả tăng
            credit: 0,
            balanceAfter: newDebt,
            note: `Ghi nợ phiếu nhập hàng ${receipt.code}`,
          },
        });
      }

      // 4. Update PO status if linked
      if (data.purchaseOrderId) {
        await tx.purchaseOrder.update({
          where: { id: data.purchaseOrderId },
          data: { status: PurchaseOrderStatus.RECEIVED },
        });
      }

      return receipt;
    });
  }
}
