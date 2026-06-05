import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ErrorCode, AppException } from '../../common/exceptions/http-exception.filter';
import { isPrismaUniqueConstraintError } from '../../common/prisma/prisma-error.utils';
import { CreateShopDto } from '../dto/create-shop.dto';
import { UpdateShopDto, ShopContactPatchDto } from '../dto/update-shop.dto';
import { ShopAppearancePatchDto, ShopLoyaltyPatchDto } from '../dto/update-shop-appearance.dto';
import { Prisma, ShopAuditAction } from '../../generated/prisma/client';
import { jsonStableStringify } from '../json-stable-stringify';
import { ShopsAuditService } from './shops-audit.service';
import { QueryShopItemsDto } from '../dto/query-shop-items.dto';
import { IStorageService } from '../../storage/storage.interface';
import { toNumber } from '../../common/utils/decimal.utils';
import { totalPagesFromCount } from '../../common/utils/pagination.utils';
import { resolveMediaSigningSecret } from '../../common/media/media-signing-secret';
import { extractShopBrandingRelativePath } from '../../common/media/resolve-receipt-logo-url';
import { hydrateAppearanceJson } from '../utils/hydrate-appearance';
import { mergeContactJson, mergeAppearanceJson, mergeLoyaltyJson } from '../utils/merge-shop-json';

const MAX_SLUG_ALLOCATION_ATTEMPTS = 32;

@Injectable()
export class ShopsCrudService {
  constructor(
    private prisma: PrismaService,
    @Inject('IStorageService') private storage: IStorageService,
    private readonly audit: ShopsAuditService,
    private readonly config: ConfigService,
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

  private shopSlugCandidate(base: string, attemptIndex: number): string {
    return attemptIndex === 0 ? base : `${base}-${attemptIndex}`;
  }

  private async hydrateAppearanceJson(json: Prisma.JsonValue): Promise<Prisma.JsonValue> {
    return hydrateAppearanceJson(json, this.storage, this.config);
  }

  private normalizeAppearancePatch(patch: ShopAppearancePatchDto, secret?: string): ShopAppearancePatchDto {
    const normalized = { ...patch };
    for (const key of ['logo_url', 'favicon_url'] as const) {
      const val = normalized[key];
      if (typeof val !== 'string') continue;
      const rel = extractShopBrandingRelativePath(val.trim(), secret);
      if (rel) normalized[key] = rel;
    }
    return normalized;
  }

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
    const oldShop = await this.findOne(id);
    const data: Prisma.ShopUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (dto.contact !== undefined) {
      data.contact_json = mergeContactJson(oldShop.contact_json, dto.contact);
    }

    const updated = await this.prisma.shop.update({
      where: { id },
      data,
    });
    const activationChanged =
      dto.is_active !== undefined && oldShop.is_active !== updated.is_active;
    const nameChanged = dto.name !== undefined && oldShop.name !== updated.name;
    const contactChanged =
      dto.contact !== undefined &&
      jsonStableStringify(oldShop.contact_json) !== jsonStableStringify(updated.contact_json);

    if (activationChanged) {
      await this.audit.createAuditLog(
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
      await this.audit.createAuditLog(
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

    if (contactChanged) {
      await this.audit.createAuditLog(id, ShopAuditAction.update_shop, actorUserId ?? null, 'shop', id, {
        field: 'contact_json',
      });
    }

    return updated;
  }

  async deactivate(id: string, actorUserId?: string | null) {
    await this.findOne(id);
    const updated = await this.prisma.shop.update({
      where: { id },
      data: { is_active: false },
    });
    await this.audit.createAuditLog(
      id,
      ShopAuditAction.deactivate_shop,
      actorUserId ?? null,
      'shop',
      id,
      { is_active: false },
    );
    return updated;
  }

  async getTenantShopSettings(tenantId: string) {
    const shop = await this.prisma.shop.findFirst({
      where: { id: tenantId, is_active: true },
      select: {
        id: true,
        name: true,
        slug: true,
        contact_json: true,
        appearance_json: true,
        loyalty_json: true,
      },
    });
    if (!shop) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Shop not found');
    }
    return { ...shop, appearance_json: await this.hydrateAppearanceJson(shop.appearance_json) };
  }

  async updateContactAndAppearanceForTenant(
    tenantId: string,
    contact?: ShopContactPatchDto,
    appearance?: ShopAppearancePatchDto,
    actorUserId?: string | null,
    loyalty?: ShopLoyaltyPatchDto,
  ) {
    if (contact === undefined && appearance === undefined && loyalty === undefined) {
      return this.getTenantShopSettings(tenantId);
    }

    const oldShop = await this.prisma.shop.findFirst({
      where: { id: tenantId, is_active: true },
      select: {
        id: true,
        name: true,
        slug: true,
        contact_json: true,
        appearance_json: true,
        loyalty_json: true,
      },
    });
    if (!oldShop) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Shop not found');
    }

    const data: Prisma.ShopUpdateInput = {};
    if (contact !== undefined) {
      data.contact_json = mergeContactJson(oldShop.contact_json, contact);
    }
    if (appearance !== undefined) {
      let normSecret: string | undefined;
      try { normSecret = resolveMediaSigningSecret(this.config); } catch { /* ignore */ }
      data.appearance_json = mergeAppearanceJson(
        oldShop.appearance_json,
        this.normalizeAppearancePatch(appearance, normSecret),
      );
    }
    if (loyalty !== undefined) {
      data.loyalty_json = mergeLoyaltyJson(oldShop.loyalty_json, loyalty);
    }

    const contactChanged =
      contact !== undefined &&
      jsonStableStringify(oldShop.contact_json) !== jsonStableStringify(data.contact_json);
    const appearanceChanged =
      appearance !== undefined &&
      jsonStableStringify(oldShop.appearance_json) !== jsonStableStringify(data.appearance_json);
    const loyaltyChanged =
      loyalty !== undefined &&
      jsonStableStringify(oldShop.loyalty_json) !== jsonStableStringify(data.loyalty_json);

    const updated = await this.prisma.$transaction(async (tx) => {
      return tx.shop.update({
        where: { id: tenantId },
        data,
      });
    });

    if (contactChanged) {
      await this.audit.createAuditLog(tenantId, ShopAuditAction.update_shop, actorUserId ?? null, 'shop', tenantId, {
        field: 'contact_json',
      });
    }
    if (appearanceChanged) {
      await this.audit.createAuditLog(tenantId, ShopAuditAction.update_shop, actorUserId ?? null, 'shop', tenantId, {
        field: 'appearance_json',
      });
    }
    if (loyaltyChanged) {
      await this.audit.createAuditLog(tenantId, ShopAuditAction.update_shop, actorUserId ?? null, 'shop', tenantId, {
        field: 'loyalty_json',
      });
    }

    return { ...updated, appearance_json: await this.hydrateAppearanceJson(updated.appearance_json) };
  }

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
      items: await Promise.all(
        items.map(async (item) => ({
          id: item.id,
          name: item.name,
          price: toNumber(item.price),
          created_at: item.created_at,
          cover_image_url: item.item_images[0]
            ? await this.storage.getFileUrl(item.item_images[0].file_path)
            : null,
        })),
      ),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: totalPagesFromCount(total, pageSize),
      },
    };
  }
}
