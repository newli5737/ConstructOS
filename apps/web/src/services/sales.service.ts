import { api } from '../api/client';
import { SalesOrder } from '../types';

export interface CreateOrderDto {
  customerId: string;
  siteId?: string | null;
  warehouseId: string;
  orderDate?: string;
  dueDate?: string | null;
  discountAmount?: number;
  shippingFee?: number;
  paidAmount?: number;
  paymentMethod?: 'CASH' | 'TRANSFER';
  note?: string;
  confirmNow?: boolean;
  allowNegativeStock?: boolean;
  items: {
    productId: string;
    unitName: string;
    quantity: number;
    factor?: number;
    unitPrice: number;
    discountPct?: number;
  }[];
}

export const salesService = {
  async getOrders(params?: any): Promise<SalesOrder[]> {
    const res = await api.get<SalesOrder[]>('/sales-orders', { params });
    return res.data;
  },

  async getOrder(id: string): Promise<SalesOrder> {
    const res = await api.get<SalesOrder>(`/sales-orders/${id}`);
    return res.data;
  },

  async createOrder(dto: CreateOrderDto): Promise<SalesOrder> {
    const res = await api.post<SalesOrder>('/sales-orders', dto);
    return res.data;
  },

  async confirmOrder(id: string): Promise<SalesOrder> {
    const res = await api.post<SalesOrder>(`/sales-orders/${id}/confirm`);
    return res.data;
  },

  async cancelOrder(id: string): Promise<SalesOrder> {
    const res = await api.post<SalesOrder>(`/sales-orders/${id}/cancel`);
    return res.data;
  },
};
