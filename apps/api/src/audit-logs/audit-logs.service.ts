import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { entity?: string; action?: string }) {
    const where: any = {};
    if (params?.entity) where.entity = params.entity;
    if (params?.action) where.action = params.action;

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}

