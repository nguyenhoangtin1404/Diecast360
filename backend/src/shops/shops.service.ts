import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ErrorCode, AppException } from '../common/exceptions/http-exception.filter';

export interface CreateShopDto {
  name: string;
  slug: string;
}

export interface UpdateShopDto {
  name?: string;
  is_active?: boolean;
}

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  /**
   * List all shops — super-admin only, no tenant filter.
   */
  async findAll() {
    return this.prisma.shop.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: { select: { items: true, user_roles: true } },
      },
    });
  }

  async findOne(id: string) {
    const shop = await this.prisma.shop.findUnique({
      where: { id },
      include: {
        _count: { select: { items: true, user_roles: true } },
      },
    });
    if (!shop) {
      throw new AppException(ErrorCode.NOT_FOUND, `Shop ${id} not found`);
    }
    return shop;
  }

  async create(dto: CreateShopDto) {
    return this.prisma.shop.create({
      data: {
        name: dto.name,
        slug: dto.slug,
      },
    });
  }

  async update(id: string, dto: UpdateShopDto) {
    await this.findOne(id); // throws 404 if not found
    return this.prisma.shop.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Deactivate a shop (soft disable — data is retained).
   */
  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.shop.update({
      where: { id },
      data: { is_active: false },
    });
  }

  /**
   * List members of a shop.
   */
  async findMembers(shopId: string) {
    await this.findOne(shopId); // 404 guard
    return this.prisma.userShopRole.findMany({
      where: { shop_id: shopId },
      include: { user: { select: { id: true, email: true, full_name: true, role: true, is_active: true } } },
    });
  }
}
