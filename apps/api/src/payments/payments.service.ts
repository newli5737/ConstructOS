import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentType, PartnerType, PaymentMethod, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { type?: PaymentType; partnerType?: PartnerType; partnerId?: string }) {
    const where: any = {};
    if (params?.type) where.type = params.type;
    if (params?.partnerType) where.partnerType = params.partnerType;
    if (params?.partnerId) where.partnerId = params.partnerId;

    return this.prisma.payment.findMany({
      where,
      include: {
        allocations: true,
      },
      orderBy: { paidAt: 'desc' },
    });
  }

  async create(data: {
    type: PaymentType;
    partnerType: PartnerType;
    partnerId: string;
    amount: number;
    method: PaymentMethod;
    paidAt?: string;
    note?: string;
    orderId?: string; // Optional specific order to allocate
  }) {
    const amount = Number(data.amount);
    if (amount <= 0) {
      throw new BadRequestException('Số tiền thanh toán phải lớn hơn 0');
    }

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = data.type === PaymentType.RECEIPT ? `PT-${yy}${mm}-` : `PC-${yy}${mm}-`;

    const last = await this.prisma.payment.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: 'desc' },
    });
    let seq = 1;
    if (last) {
      const parts = last.code.split('-');
      if (parts.length === 3) seq = parseInt(parts[2], 10) + 1;
    }
    const code = `${prefix}${String(seq).padStart(4, '0')}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const payment = await tx.payment.create({
        data: {
          code,
          type: data.type,
          partnerType: data.partnerType,
          partnerId: data.partnerId,
          amount,
          method: data.method || PaymentMethod.CASH,
          paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
          note: data.note,
        },
      });

      // 2. Process Debt Ledger & Partner Balance
      if (data.partnerType === PartnerType.CUSTOMER) {
        const customer = await tx.customer.findUnique({ where: { id: data.partnerId } });
        if (!customer) throw new BadRequestException('Không tìm thấy khách hàng');

        const newDebt = Math.max(0, Number(customer.currentDebt) - amount);
        await tx.customer.update({
          where: { id: data.partnerId },
          data: { currentDebt: newDebt },
        });

        await tx.debtLedger.create({
          data: {
            partnerType: PartnerType.CUSTOMER,
            partnerId: data.partnerId,
            refType: 'PAYMENT_RECEIPT',
            refId: payment.id,
            debit: 0,
            credit: amount, // Giảm nợ
            balanceAfter: newDebt,
            note: `Thu tiền: ${payment.code} (${data.note || 'Thu tiền khách hàng'})`,
          },
        });

        // FIFO Allocation or Specific Order Allocation
        let unallocated = amount;

        if (data.orderId) {
          // Specific order
          const order = await tx.salesOrder.findUnique({ where: { id: data.orderId } });
          if (order) {
            const need = Number(order.total) - Number(order.paidAmount);
            const alloc = Math.min(unallocated, need);
            if (alloc > 0) {
              const newPaid = Number(order.paidAmount) + alloc;
              const pStatus = newPaid >= Number(order.total) ? PaymentStatus.PAID : PaymentStatus.PARTIAL;

              await tx.salesOrder.update({
                where: { id: order.id },
                data: { paidAmount: newPaid, paymentStatus: pStatus },
              });

              await tx.paymentAllocation.create({
                data: {
                  paymentId: payment.id,
                  orderType: 'SALES_ORDER',
                  orderId: order.id,
                  amount: alloc,
                },
              });

              unallocated -= alloc;
            }
          }
        }

        // Allocate remaining via FIFO
        if (unallocated > 0) {
          const unpaidOrders = await tx.salesOrder.findMany({
            where: {
              customerId: data.partnerId,
              paymentStatus: { in: ['UNPAID', 'PARTIAL'] },
              status: { notIn: ['CANCELLED', 'DRAFT'] },
            },
            orderBy: { orderDate: 'asc' }, // FIFO: oldest first
          });

          for (const order of unpaidOrders) {
            if (unallocated <= 0) break;
            const need = Number(order.total) - Number(order.paidAmount);
            if (need <= 0) continue;

            const alloc = Math.min(unallocated, need);
            const newPaid = Number(order.paidAmount) + alloc;
            const pStatus = newPaid >= Number(order.total) ? PaymentStatus.PAID : PaymentStatus.PARTIAL;

            await tx.salesOrder.update({
              where: { id: order.id },
              data: { paidAmount: newPaid, paymentStatus: pStatus },
            });

            await tx.paymentAllocation.create({
              data: {
                paymentId: payment.id,
                orderType: 'SALES_ORDER',
                orderId: order.id,
                amount: alloc,
              },
            });

            unallocated -= alloc;
          }
        }
      } else {
        // SUPPLIER PAYMENT
        const supplier = await tx.supplier.findUnique({ where: { id: data.partnerId } });
        if (!supplier) throw new BadRequestException('Không tìm thấy nhà cung cấp');

        const newDebt = Math.max(0, Number(supplier.currentDebt) - amount);
        await tx.supplier.update({
          where: { id: data.partnerId },
          data: { currentDebt: newDebt },
        });

        await tx.debtLedger.create({
          data: {
            partnerType: PartnerType.SUPPLIER,
            partnerId: data.partnerId,
            refType: 'PAYMENT_DISBURSEMENT',
            refId: payment.id,
            debit: 0,
            credit: amount, // Giảm nợ phải trả
            balanceAfter: newDebt,
            note: `Chi tiền trả NCC: ${payment.code}`,
          },
        });

        // FIFO allocate to unpaid Goods Receipts
        let unallocated = amount;
        const unpaidReceipts = await tx.goodsReceipt.findMany({
          where: {
            supplierId: data.partnerId,
            paymentStatus: { in: ['UNPAID', 'PARTIAL'] },
          },
          orderBy: { receiptDate: 'asc' },
        });

        for (const gr of unpaidReceipts) {
          if (unallocated <= 0) break;
          const need = Number(gr.total) - Number(gr.paidAmount);
          if (need <= 0) continue;

          const alloc = Math.min(unallocated, need);
          const newPaid = Number(gr.paidAmount) + alloc;
          const pStatus = newPaid >= Number(gr.total) ? PaymentStatus.PAID : PaymentStatus.PARTIAL;

          await tx.goodsReceipt.update({
            where: { id: gr.id },
            data: { paidAmount: newPaid, paymentStatus: pStatus },
          });

          await tx.paymentAllocation.create({
            data: {
              paymentId: payment.id,
              orderType: 'GOODS_RECEIPT',
              orderId: gr.id,
              amount: alloc,
            },
          });

          unallocated -= alloc;
        }
      }

      return payment;
    });
  }
}
