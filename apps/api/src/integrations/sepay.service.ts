import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class SepayService {
  private readonly logger = new Logger(SepayService.name);

  constructor(private prisma: PrismaService) {}

  async handleWebhook(payload: any, authHeader?: string) {
    this.logger.log(`Received SePay webhook payload: ${JSON.stringify(payload)}`);

    // Payload SePay format: { id, gateway, transactionDate, accountNumber, transferType, transferAmount, content, ... }
    const transactionId = String(payload.id || payload.transactionId || `TX-${Date.now()}`);
    const amount = Number(payload.transferAmount || payload.amount || 0);
    const content = String(payload.content || payload.description || '');

    // 1. Check idempotency: avoid processing twice
    const existing = await this.prisma.bankTransaction.findUnique({
      where: { transactionId },
    });
    if (existing) {
      return { success: true, message: 'Already processed' };
    }

    // 2. Try to match order code (e.g. BH-2611-0001 or BH26110001)
    const match = content.match(/BH-?\d{4}-?\d{4}/i);
    let matchedOrder: any = null;

    if (match) {
      const extractedCode = match[0].toUpperCase();
      // Look for order
      matchedOrder = await this.prisma.salesOrder.findFirst({
        where: {
          OR: [
            { code: extractedCode },
            { code: extractedCode.replace(/(\w{2})(\d{4})(\d{4})/, '$1-$2-$3') },
          ],
        },
      });
    }

    let status = 'UNMATCHED';
    let refOrderCode = null;

    if (matchedOrder) {
      status = 'MATCHED';
      refOrderCode = matchedOrder.code;

      // Automatically create Payment and allocate
      await this.prisma.$transaction(async (tx) => {
        const paymentCode = `PT-SP-${transactionId.slice(-6)}`;
        const payment = await tx.payment.create({
          data: {
            code: paymentCode,
            type: 'RECEIPT',
            partnerType: 'CUSTOMER',
            partnerId: matchedOrder.customerId,
            amount,
            method: PaymentMethod.TRANSFER,
            note: `Tự động đối soát SePay: ${content}`,
          },
        });

        // Deduct remaining debt
        const customer = await tx.customer.findUnique({
          where: { id: matchedOrder.customerId },
        });
        if (customer) {
          const newDebt = Math.max(0, Number(customer.currentDebt) - amount);
          await tx.customer.update({
            where: { id: customer.id },
            data: { currentDebt: newDebt },
          });

          await tx.debtLedger.create({
            data: {
              partnerType: 'CUSTOMER',
              partnerId: customer.id,
              refType: 'SEPAY_AUTO_RECEIPT',
              refId: payment.id,
              debit: 0,
              credit: amount,
              balanceAfter: newDebt,
              note: `Thu tiền tự động SePay đơn ${matchedOrder.code}`,
            },
          });
        }

        // Allocate to order
        const newPaid = Number(matchedOrder.paidAmount) + amount;
        const pStatus = newPaid >= Number(matchedOrder.total) ? PaymentStatus.PAID : PaymentStatus.PARTIAL;

        await tx.salesOrder.update({
          where: { id: matchedOrder.id },
          data: {
            paidAmount: newPaid,
            paymentStatus: pStatus,
          },
        });

        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            orderType: 'SALES_ORDER',
            orderId: matchedOrder.id,
            amount,
          },
        });
      });
    }

    // Save Bank Transaction record
    await this.prisma.bankTransaction.create({
      data: {
        transactionId,
        gateway: payload.gateway || 'SEPAY',
        amount,
        content,
        transferType: payload.transferType || 'in',
        status,
        refOrderCode,
        rawPayload: payload,
      },
    });

    return {
      success: true,
      status,
      refOrderCode,
    };
  }

  async getTransactions() {
    return this.prisma.bankTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}

