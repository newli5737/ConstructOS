import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    const list = await this.prisma.setting.findMany();
    const map: Record<string, string> = {
      storeName: 'constructOS - VLXD & Sắt Thép',
      storePhone: '0908 123 456',
      storeAddress: '124 Đường Đại Lộ Xây Dựng, Khu Công Nghiệp Hòa Lạc, Hà Nội',
      storeTaxCode: '0109988776',
      bankName: 'MBBank',
      bankAccountNo: '999988886666',
      bankAccountName: 'CONSTRUCTOS STORE',
      allowNegativeStock: 'true',
      sepayApiKey: '',
    };

    for (const item of list) {
      map[item.key] = item.value;
    }
    return map;
  }

  async update(settings: Record<string, string>) {
    for (const [key, value] of Object.entries(settings)) {
      await this.prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
    return this.getAll();
  }
}
