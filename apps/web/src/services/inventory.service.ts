import { api } from '../api/client';
import { Warehouse } from '../types';

export const inventoryService = {
  async getWarehouses(): Promise<Warehouse[]> {
    const res = await api.get<Warehouse[]>('/warehouses');
    return res.data;
  },

  async getBalances(warehouseId?: string): Promise<any[]> {
    const res = await api.get('/inventory/balances', { params: { warehouseId } });
    return res.data;
  },

  async getStockLedger(params?: any): Promise<any[]> {
    const res = await api.get('/inventory/ledger', { params });
    return res.data;
  },

  async createAdjustment(data: any): Promise<any> {
    const res = await api.post('/inventory/adjustments', data);
    return res.data;
  },

  async createTransfer(data: any): Promise<any> {
    const res = await api.post('/inventory/transfers', data);
    return res.data;
  },
};

