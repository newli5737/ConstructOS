import { api } from '../api/client';
import { Customer, Supplier } from '../types';

export const partnersService = {
  async getCustomers(q?: string): Promise<Customer[]> {
    const res = await api.get<Customer[]>('/customers', { params: { q } });
    return res.data;
  },

  async createCustomer(data: any): Promise<Customer> {
    const res = await api.post<Customer>('/customers', data);
    return res.data;
  },

  async getSuppliers(): Promise<Supplier[]> {
    const res = await api.get<Supplier[]>('/suppliers');
    return res.data;
  },

  async createSupplier(data: any): Promise<Supplier> {
    const res = await api.post<Supplier>('/suppliers', data);
    return res.data;
  },
};
