import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  // ===================== PRODUCTS =====================
  async getProducts(params?: { categoryId?: string; search?: string; isActive?: boolean }) {
    const where: any = {};
    if (params?.categoryId) where.categoryId = params.categoryId;
    if (params?.isActive !== undefined) where.isActive = params.isActive;
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
        { barcode: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.product.findMany({
      where,
      include: {
        category: true,
        units: true,
        prices: {
          include: { priceList: true },
        },
        stockBalances: {
          include: { warehouse: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        units: true,
        prices: { include: { priceList: true } },
        stockBalances: { include: { warehouse: true } },
      },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return product;
  }

  async createProduct(data: any) {
    const { units, prices, ...productData } = data;
    return this.prisma.product.create({
      data: {
        ...productData,
        units: units?.length
          ? {
              create: units.map((u: any) => ({
                unitName: u.unitName,
                factor: u.factor,
                isDefaultSale: u.isDefaultSale ?? false,
                isDefaultPurchase: u.isDefaultPurchase ?? false,
              })),
            }
          : undefined,
        prices: prices?.length
          ? {
              create: prices.map((p: any) => ({
                priceListId: p.priceListId,
                unitName: p.unitName,
                price: p.price,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        units: true,
        prices: true,
      },
    });
  }

  async updateProduct(id: string, data: any) {
    const { units, prices, ...productData } = data;

    if (units) {
      await this.prisma.productUnit.deleteMany({ where: { productId: id } });
    }
    if (prices) {
      await this.prisma.productPrice.deleteMany({ where: { productId: id } });
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        units: units
          ? {
              create: units.map((u: any) => ({
                unitName: u.unitName,
                factor: u.factor,
                isDefaultSale: u.isDefaultSale ?? false,
                isDefaultPurchase: u.isDefaultPurchase ?? false,
              })),
            }
          : undefined,
        prices: prices
          ? {
              create: prices.map((p: any) => ({
                priceListId: p.priceListId,
                unitName: p.unitName,
                price: p.price,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        units: true,
        prices: true,
      },
    });
  }

  async deleteProduct(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ===================== CATEGORIES =====================
  async getCategories() {
    return this.prisma.productCategory.findMany({
      include: {
        children: true,
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCategory(data: any) {
    return this.prisma.productCategory.create({ data });
  }

  async updateCategory(id: string, data: any) {
    return this.prisma.productCategory.update({ where: { id }, data });
  }

  // ===================== PRICE LISTS =====================
  async getPriceLists() {
    return this.prisma.priceList.findMany({
      include: {
        _count: { select: { prices: true, customerGroups: true } },
      },
    });
  }

  async createPriceList(data: any) {
    return this.prisma.priceList.create({ data });
  }

  // ===================== WAREHOUSES =====================
  async getWarehouses() {
    return this.prisma.warehouse.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { stockBalances: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async createWarehouse(data: any) {
    return this.prisma.warehouse.create({ data });
  }

  async updateWarehouse(id: string, data: any) {
    return this.prisma.warehouse.update({ where: { id }, data });
  }
}

