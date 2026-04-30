import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ErrorCode, AppException } from '../common/exceptions/http-exception.filter';
import { isPrismaUniqueConstraintError } from '../common/prisma/prisma-error.utils';
import { CreateShopDto } from './dto/create-shop.dto';
import { QueryShopMembersDto } from './dto/query-shop-members.dto';
import { QueryShopItemsDto } from './dto/query-shop-items.dto';
import { QueryShopAuditLogsDto } from './dto/query-shop-audit-logs.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { AddShopAdminDto } from './dto/add-shop-admin.dto';
import { ShopAuditAction, ShopRole } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { isUUID } from 'class-validator';
import { IStorageService } from '../storage/storage.interface';
import { toNumber } from '../common/utils/decimal.utils';
import { totalPagesFromCount } from '../common/utils/pagination.utils';
import { RolesGuard } from '../common/guards/roles.guard';

const MAX_SLUG_ALLOCATION_ATTEMPTS = 32;

@Injectable()
export class ShopsService {
  constructor(
    private prisma: PrismaService,
    @Inject('IStorageService') private storage: IStorageService,
  ) {}

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

  private async logAudit(
    shopId: string,
    action: ShopAuditAction,
    actorUserId: string | null,
    targetType: string,
    targetId?: string | null,
    metadata?: Record<string, unknown>,
  ) {
    const safeMetadata = metadata
      ? JSON.stringify(
          metadata,
          (key, value) => {
            const lower = key.toLowerCase();
            if (
              lower.includes('password') ||
              lower.includes('token') ||
              lower.includes('secret')
            ) {
              return '[REDACTED]';
            }
            return value;
          },
        )
      : null;

    await this.prisma.shopAuditLog.create({
      data: {
        shop_id: shopId,
        actor_user_id: actorUserId ?? null,
        action,
        target_type: targetType,
        target_id: targetId ?? null,
        metadata_json: safeMetadata,
      },
    });
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

  async update(id: string, dto: UpdateShopDto, actorUserId?: string | null) {
    const oldShop = await this.findOne(id); // throws 404 if not found
    const updated = await this.prisma.shop.update({
      where: { id },
      data: dto,
    });
    const activationChanged =
      dto.is_active !== undefined && oldShop.is_active !== updated.is_active;
    const nameChanged = dto.name !== undefined && oldShop.name !== updated.name;

    if (activationChanged) {
      await this.logAudit(
        id,
        updated.is_active
          ? ShopAuditAction.activate_shop
          : ShopAuditAction.deactivate_shop,
        actorUserId ?? null,
        'shop',
        id,
        {
          before: { is_active: oldShop.is_active },
          after: { is_active: updated.is_active },
        },
      );
    }

    if (nameChanged) {
      await this.logAudit(
        id,
        ShopAuditAction.update_shop,
        actorUserId ?? null,
        'shop',
        id,
        {
          before: { name: oldShop.name },
          after: { name: updated.name },
        },
      );
    }

    return updated;
  }

  /**
   * Deactivate a shop (soft disable — data is retained).
   */
  async deactivate(id: string, actorUserId?: string | null) {
    await this.findOne(id);
    const updated = await this.prisma.shop.update({
      where: { id },
      data: { is_active: false },
    });
    await this.logAudit(
      id,
      ShopAuditAction.deactivate_shop,
      actorUserId ?? null,
      'shop',
      id,
      { is_active: false },
    );
    return updated;
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
        total_pages: totalPagesFromCount(total, pageSize),
      },
    };
  }

  /**
   * List items of a shop with pagination + keyword search.
   */
  async findItems(shopId: string, query: QueryShopItemsDto) {
    await this.findOne(shopId);
    const page = query.page || 1;
    const pageSize = query.page_size || 20;
    const skip = (page - 1) * pageSize;
    const q = query.q?.trim();

    const where = {
      shop_id: shopId,
      deleted_at: null,
      ...(q
        ? {
            name: {
              contains: q,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.item.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        include: {
          item_images: {
            where: { is_cover: true },
            take: 1,
          },
        },
      }),
      this.prisma.item.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        price: toNumber(item.price),
        created_at: item.created_at,
        cover_image_url: item.item_images[0]
          ? this.storage.getFileUrl(item.item_images[0].file_path)
          : null,
      })),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: totalPagesFromCount(total, pageSize),
      },
    };
  }

  async findAuditLogs(shopId: string, query: QueryShopAuditLogsDto) {
    await this.findOne(shopId);
    const page = query.page || 1;
    const pageSize = query.page_size || 20;
    const skip = (page - 1) * pageSize;
    const where = {
      shop_id: shopId,
      ...(query.action ? { action: query.action } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.shopAuditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { created_at: 'desc' },
        include: {
          actor: { select: { id: true, email: true, full_name: true } },
        },
      }),
      this.prisma.shopAuditLog.count({ where }),
    ]);
    return {
      logs: rows.map((r) => ({
        id: r.id,
        action: r.action,
        target_type: r.target_type,
        target_id: r.target_id,
        metadata: r.metadata_json
          ? (() => {
              try {
                return JSON.parse(r.metadata_json);
              } catch {
                return null;
              }
            })()
          : null,
        created_at: r.created_at,
        actor: r.actor,
      })),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: totalPagesFromCount(total, pageSize),
      },
    };
  }

  /**
   * Add or update a user's role in a given shop.
   * Accepts shop_admin or shop_staff (default: shop_admin).
   * Idempotent via `upsert` on composite key `(user_id, shop_id)`.
   */
  async addShopAdmin(shopId: string, dto: AddShopAdminDto, actorUserId?: string | null) {
    await this.findOne(shopId); // throws 404 if shop does not exist

    if (dto.user_id && !isUUID(dto.user_id)) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'user_id must be a valid UUID.');
    }

    const assignedRole: ShopRole = dto.role ?? ShopRole.shop_admin;

    const user =
      dto.user_id != null
        ? await this.prisma.user.findUnique({ where: { id: dto.user_id } })
        : dto.email != null
          ? await this.prisma.user.findUnique({ where: { email: dto.email } })
          : null;

    if (!user) {
      // If caller provided enough info, we create the user first.
      if (!dto.email || !dto.password) {
        throw new AppException(
          ErrorCode.NOT_FOUND,
          'User not found. Provide `password` to create the account when user does not exist.',
        );
      }

      const password_hash = await bcrypt.hash(dto.password, 10);
      return this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: dto.email!,
            password_hash,
            full_name: dto.full_name,
          },
        });

        const upserted = await tx.userShopRole.upsert({
          where: { user_id_shop_id: { user_id: created.id, shop_id: shopId } },
          create: { user_id: created.id, shop_id: shopId, role: assignedRole },
          update: { role: assignedRole },
        });

        const safeMetadata = JSON.stringify({ email: dto.email, created_user: true, role: assignedRole });
        await tx.shopAuditLog.create({
          data: {
            shop_id: shopId,
            actor_user_id: actorUserId ?? null,
            action: ShopAuditAction.set_shop_member_role,
            target_type: 'user',
            target_id: created.id,
            metadata_json: safeMetadata,
          },
        });

        // Invalidate the shared shop-roles cache so the new user's role is enforced
        // immediately on the next request rather than after the 30-second TTL expires.
        RolesGuard.invalidateShopRolesCache(created.id);
        return upserted;
      });
    }

    const upserted = await this.prisma.userShopRole.upsert({
      where: { user_id_shop_id: { user_id: user.id, shop_id: shopId } },
      create: { user_id: user.id, shop_id: shopId, role: assignedRole },
      update: { role: assignedRole },
    });
    await this.logAudit(
      shopId,
      ShopAuditAction.set_shop_member_role,
      actorUserId ?? null,
      'user',
      user.id,
      { email: dto.email ?? null, created_user: false, role: assignedRole },
    );
    // Invalidate the shared shop-roles cache so the updated role is enforced immediately.
    RolesGuard.invalidateShopRolesCache(user.id);
    return upserted;
  }

  /**
   * Set password for a user who belongs to the shop (super-admin only, via controller).
   */
  async resetMemberPassword(
    shopId: string,
    memberUserId: string,
    plainPassword: string,
    actorUserId?: string | null,
  ) {
    await this.findOne(shopId);
    const membership = await this.prisma.userShopRole.findUnique({
      where: {
        user_id_shop_id: { user_id: memberUserId, shop_id: shopId },
      },
    });
    if (!membership) {
      throw new AppException(
        ErrorCode.NOT_FOUND,
        'User is not a member of this shop.',
      );
    }
    const password_hash = await bcrypt.hash(plainPassword, 10);
    await this.prisma.user.update({
      where: { id: memberUserId },
      data: { password_hash },
    });
    await this.logAudit(
      shopId,
      ShopAuditAction.reset_member_password,
      actorUserId ?? null,
      'user',
      memberUserId,
      { reset: true },
    );
    return { updated: true };
  }

  /**
   * Enable or disable login for a user who belongs to the shop.
   */
  async setMemberAccountActive(
    shopId: string,
    memberUserId: string,
    is_active: boolean,
    actorUserId?: string | null,
  ) {
    await this.findOne(shopId);
    const membership = await this.prisma.userShopRole.findUnique({
      where: {
        user_id_shop_id: { user_id: memberUserId, shop_id: shopId },
      },
    });
    if (!membership) {
      throw new AppException(
        ErrorCode.NOT_FOUND,
        'User is not a member of this shop.',
      );
    }
    await this.prisma.user.update({
      where: { id: memberUserId },
      data: { is_active },
    });
    await this.logAudit(
      shopId,
      ShopAuditAction.set_member_active,
      actorUserId ?? null,
      'user',
      memberUserId,
      { is_active },
    );
    return { updated: true };
  }
}
