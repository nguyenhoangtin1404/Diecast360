import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ErrorCode, AppException } from '../common/exceptions/http-exception.filter';
import { isPrismaUniqueConstraintError } from '../common/prisma/prisma-error.utils';
import { CreateShopDto } from './dto/create-shop.dto';
import { QueryShopMembersDto } from './dto/query-shop-members.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

const MAX_SLUG_ALLOCATION_ATTEMPTS = 32;

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) {}

  private slugFromName(name: string): string {
    const s = name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return s || 'shop';
  }

  /** Slug candidate: `base`, then `base-1`, `base-2`, ... (matches prior allocateUniqueSlug numbering). */
  private shopSlugCandidate(base: string, attemptIndex: number): string {
    return attemptIndex === 0 ? base : `${base}-${attemptIndex}`;
  }

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
    const name = dto.name.trim();
    const baseSlug = dto.slug?.trim() ? dto.slug.trim() : this.slugFromName(name);

    for (let i = 0; i < MAX_SLUG_ALLOCATION_ATTEMPTS; i++) {
      const slug = this.shopSlugCandidate(baseSlug, i);
      try {
        return await this.prisma.shop.create({
          data: { name, slug },
        });
      } catch (e) {
        if (isPrismaUniqueConstraintError(e)) {
          continue;
        }
        throw e;
      }
    }

    throw new AppException(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Could not allocate a unique shop slug. Please try a different name or slug.',
    );
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
  async findMembers(shopId: string, query: QueryShopMembersDto) {
    await this.findOne(shopId); // 404 guard
    const page = query.page || 1;
    const pageSize = query.page_size || 20;
    const skip = (page - 1) * pageSize;

    const where = { shop_id: shopId };
    const [members, total] = await this.prisma.$transaction([
      this.prisma.userShopRole.findMany({
        where,
        include: { user: { select: { id: true, email: true, full_name: true, role: true, is_active: true } } },
        orderBy: { user_id: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.userShopRole.count({ where }),
    ]);

    return {
      members,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  }
}
