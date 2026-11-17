import { api } from '../api/client';

export const debtService = {
  async getDebtAging(): Promise<any> {
    const res = await api.get('/debt/aging');
    return res.data;
  },

  async getStatement(params: { partnerType: string; partnerId: string; from?: string; to?: string }): Promise<any> {
    const res = await api.get('/debt/statement', { params });
    return res.data;
  },

  async recordPayment(data: any): Promise<any> {
    const res = await api.post('/debt/payments', data);
    return res.data;
  },
};

export const reportsService = {
  async getDashboardStats(): Promise<any> {
    const res = await api.get('/reports/dashboard');
    return res.data;
  },

  async getProfitReport(params?: any): Promise<any> {
    const res = await api.get('/reports/profit', { params });
    return res.data;
  },
};

export const settingsService = {
  async getSettings(): Promise<Record<string, string>> {
    const res = await api.get('/settings');
    return res.data;
  },

  async updateSettings(data: Record<string, string>): Promise<any> {
    const res = await api.put('/settings', data);
    return res.data;
  },

  async getUsers(): Promise<any[]> {
    const res = await api.get('/users');
    return res.data;
  },

  async getAuditLogs(): Promise<any[]> {
    const res = await api.get('/audit-logs');
    return res.data;
  },
};
