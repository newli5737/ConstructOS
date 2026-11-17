import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    const { passwordHash, ...rest } = user;
    return rest;
  }

  async create(data: any) {
    const passwordHash = await bcrypt.hash(data.password || 'Construct@123', 10);
    const user = await this.prisma.user.create({
      data: {
        username: data.username.toLowerCase(),
        email: data.email.toLowerCase(),
        fullName: data.fullName,
        phone: data.phone,
        passwordHash,
        roles: data.roleIds?.length
          ? {
              create: data.roleIds.map((roleId: string) => ({ roleId })),
            }
          : undefined,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    const { passwordHash: _, ...rest } = user;
    return rest;
  }

  async update(id: string, data: any) {
    const updateData: any = {
      fullName: data.fullName,
      phone: data.phone,
      isActive: data.isActive,
    };
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }
    if (data.roleIds) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      updateData.roles = {
        create: data.roleIds.map((roleId: string) => ({ roleId })),
      };
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    const { passwordHash: _, ...rest } = user;
    return rest;
  }

  async getRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async getPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }
}
