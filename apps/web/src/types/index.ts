export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTANT';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  roles: string[];
  permissions: string[];
}

export interface ProductCategory {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  children?: ProductCategory[];
  _count?: { products: number };
}

export interface ProductUnit {
  id?: string;
  unitName: string;
  factor: number;
  isDefaultSale?: boolean;
  isDefaultPurchase?: boolean;
}

export interface PriceList {
  id: string;
  code: string;
  name: string;
  description?: string;
  isDefault: boolean;
}

export interface ProductPrice {
  id?: string;
  priceListId: string;
  priceList?: PriceList;
  unitName: string;
  price: number;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  categoryId?: string;
  category?: ProductCategory;
  baseUnit: string;
  costPrice: number;
  minStock: number;
  imageUrl?: string;
  isActive: boolean;
  units: ProductUnit[];
  prices: ProductPrice[];
  stockBalances?: { warehouseId: string; warehouse?: Warehouse; quantity: number }[];
}

export interface CustomerSite {
  id: string;
  customerId: string;
  name: string;
  address: string;
  contact?: string;
}

export interface CustomerGroup {
  id: string;
  code: string;
  name: string;
  priceListId?: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone?: string;
  address?: string;
  taxCode?: string;
  groupId?: string;
  group?: CustomerGroup;
  creditLimit: number;
  paymentTermDays: number;
  currentDebt: number;
  note?: string;
  isActive: boolean;
  sites?: CustomerSite[];
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone?: string;
  address?: string;
  taxCode?: string;
  paymentTermDays: number;
  currentDebt: number;
  note?: string;
  isActive: boolean;
}

export type SalesOrderStatus = 'DRAFT' | 'CONFIRMED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface SalesOrderItem {
  id?: string;
  productId: string;
  product?: Product;
  unitName: string;
  quantity: number;
  baseQuantity?: number;
  unitPrice: number;
  discountPct?: number;
  lineTotal: number;
  costAtSale?: number;
}

export interface SalesOrder {
  id: string;
  code: string;
  customerId: string;
  customer: Customer;
  siteId?: string;
  site?: CustomerSite;
  orderDate: string;
  dueDate?: string;
  status: SalesOrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  total: number;
  paidAmount: number;
  note?: string;
  salesperson?: { id: string; fullName: string; username: string };
  items: SalesOrderItem[];
  deliveries?: any[];
}

export interface StockBalanceItem {
  id: string;
  sku: string;
  name: string;
  category?: string;
  baseUnit: string;
  minStock: number;
  costPrice: number;
  totalStock: number;
  totalValue: number;
  isLowStock: boolean;
  balances: { warehouseId: string; warehouseName: string; quantity: number }[];
}

export interface StockMovement {
  id: string;
  productId: string;
  warehouseId: string;
  warehouse: Warehouse;
  product: Product;
  movementType: string;
  quantity: number;
  balanceAfter: number;
  refType: string;
  refId: string;
  unitCost: number;
  note?: string;
  createdAt: string;
}

export interface AgingReport {
  summary: {
    under30: number;
    days31to60: number;
    days61to90: number;
    over90: number;
  };
  customers: {
    customerId: string;
    customerCode: string;
    customerName: string;
    phone?: string;
    creditLimit: number;
    totalDebt: number;
    under30: number;
    days31to60: number;
    days61to90: number;
    over90: number;
  }[];
}

export interface DashboardData {
  todayRevenue: number;
  monthRevenue: number;
  monthGrossProfit: number;
  totalReceivable: number;
  totalPayable: number;
  lowStockCount: number;
  totalInventoryValue: number;
  pendingOrdersCount: number;
  chart30Days: { date: string; revenue: number }[];
  latestOrders: SalesOrder[];
}
