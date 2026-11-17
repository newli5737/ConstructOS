import { api } from '../api/client';
import { Product, ProductCategory, PriceList } from '../types';

export interface ProductQueryParams {
  q?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}

export interface CreateProductDto {
  sku: string;
  name: string;
  categoryId?: string | null;
  baseUnit: string;
  costPrice?: number;
  minStock?: number;
  imageUrl?: string | null;
  units?: { unitName: string; factor: number; isDefaultSale?: boolean }[];
  prices?: { priceListId: string; unitName: string; price: number }[];
}

export const catalogService = {
  async getProducts(params?: ProductQueryParams): Promise<Product[]> {
    const res = await api.get<Product[]>('/products', { params });
    return res.data;
  },

  async getProduct(id: string): Promise<Product> {
    const res = await api.get<Product>(`/products/${id}`);
    return res.data;
  },

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const res = await api.post<Product>('/products', dto);
    return res.data;
  },

  async updateProduct(id: string, dto: Partial<CreateProductDto>): Promise<Product> {
    const res = await api.patch<Product>(`/products/${id}`, dto);
    return res.data;
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },

  async getCategories(): Promise<ProductCategory[]> {
    const res = await api.get<ProductCategory[]>('/product-categories');
    return res.data;
  },

  async getPriceLists(): Promise<PriceList[]> {
    const res = await api.get<PriceList[]>('/price-lists');
    return res.data;
  },
};

