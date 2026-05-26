import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { ErrorCode, AppException } from '../common/exceptions/http-exception.filter';
import { isPrismaUniqueConstraintError } from '../common/prisma/prisma-error.utils';
import { CreateShopDto } from './dto/create-shop.dto';
import { QueryShopMembersDto } from './dto/query-shop-members.dto';
import { QueryShopItemsDto } from './dto/query-shop-items.dto';
import { QueryShopAuditLogsDto } from './dto/query-shop-audit-logs.dto';
import { UpdateShopDto, ShopContactPatchDto } from './dto/update-shop.dto';
import { ShopAppearancePatchDto, ShopLoyaltyPatchDto } from './dto/update-shop-appearance.dto';
import { AddShopAdminDto } from './dto/add-shop-admin.dto';
import { Prisma, ShopAuditAction, ShopRole } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { isUUID } from 'class-validator';
import { IStorageService } from '../storage/storage.interface';
import { toNumber } from '../common/utils/decimal.utils';
import { totalPagesFromCount } from '../common/utils/pagination.utils';
import { RolesGuard } from '../common/guards/roles.guard';
import { jsonStableStringify } from './json-stable-stringify';
import { parseShopLoyaltyJson } from './shop-loyalty-json.util';
import { UploadSupportService } from '../common/upload/upload-support.service';
import { verifySignedMediaParams } from '../common/media/signed-media.util';
import { resolveMediaSigningSecret } from '../common/media/media-signing-secret';
import { v7 as uuidv7 } from 'uuid';
import sharp from 'sharp';

const SHOP_BRANDING_MIME_ALLOWLIST = ['image/jpeg', 'image/png', 'image/webp'] as const;

const MAX_SLUG_ALLOCATION_ATTEMPTS = 32;

@Injectable()
export class ShopsService {
  private readonly logger = new Logger(ShopsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject('IStorageService') private storage: IStorageService,
    private readonly uploadSupport: UploadSupportService,
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

  /** Slug candidate: `base`, then `base-1`, `base-2`, ... (matches prior allocateUniqueSlug numbering). */
  private shopSlugCandidate(base: string, attemptIndex: number): string {
    return attemptIndex === 0 ? base : `${base}-${attemptIndex}`;
  }

  private mergeContactJson(
    existing: Prisma.JsonValue,
    patch: ShopContactPatchDto,
  ): Prisma.InputJsonValue {
    const baseObj =
      typeof existing === 'object' && existing !== null && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {};
    const next: Record<string, unknown> = { ...baseObj };

    const mergeStringRecord = (
      prevRaw: unknown,
      patchRecord: Record<string, unknown> | undefined,
    ): Record<string, unknown> => {
      const prev =
        typeof prevRaw === 'object' && prevRaw !== null && !Array.isArray(prevRaw)
          ? { ...(prevRaw as Record<string, unknown>) }
          : {};
      if (!patchRecord) return prev;
      for (const [k, v] of Object.entries(patchRecord)) {
        if (v === undefined) continue;
        if (typeof v === 'string' && v.trim() === '') {
          delete prev[k];
        } else {
          prev[k] = v;
        }
      }
      return prev;
    };

    if (patch.page_title !== undefined) {
      if (patch.page_title.trim() === '') delete next.page_title;
      else next.page_title = patch.page_title;
    }
    if (patch.page_subtitle !== undefined) {
      if (patch.page_subtitle.trim() === '') delete next.page_subtitle;
      else next.page_subtitle = patch.page_subtitle;
    }

    const nested = ['phone', 'facebook', 'zalo', 'hours'] as const;
    for (const key of nested) {
      if (patch[key] !== undefined) {
        next[key] = mergeStringRecord(next[key], patch[key] as Record<string, unknown>);
      }
    }

    return next as Prisma.InputJsonValue;
  }

  private mergeAppearanceJson(
    existing: Prisma.JsonValue,
    patch: ShopAppearancePatchDto,
  ): Prisma.InputJsonValue {
    const baseObj =
      typeof existing === 'object' && existing !== null && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {};
    const next: Record<string, unknown> = { ...baseObj };
    const entries: [keyof typeof patch, unknown][] = [
      ['logo_url', patch.logo_url],
      ['favicon_url', patch.favicon_url],
      ['primary_color', patch.primary_color],
      ['accent_color', patch.accent_color],
      ['font_family', patch.font_family],
    ];
    for (const [key, val] of entries) {
      if (val === undefined) continue;
      if (typeof val === 'string' && val.trim() === '') {
        delete next[key as string];
      } else {
        next[key as string] = val;
      }
    }
    return next as Prisma.InputJsonValue;
  }

  private mergeLoyaltyJson(existing: Prisma.JsonValue, patch: ShopLoyaltyPatchDto): Prisma.InputJsonValue {
    const baseObj =
      typeof existing === 'object' && existing !== null && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {};
    const next: Record<string, unknown> = { ...baseObj };
    if (patch.vnd_per_point !== undefined) {
      next.vnd_per_point = patch.vnd_per_point;
    }
    if (patch.preorder_points_basis !== undefined) {
      next.preorder_points_basis = patch.preorder_points_basis;
    }
    const normalized = parseShopLoyaltyJson(next);
    return {
      vnd_per_point: normalized.vnd_per_point,
      preorder_points_basis: normalized.preorder_points_basis,
    };
  }

  private extractAppearanceUrl(json: Prisma.JsonValue, key: 'logo_url' | 'favicon_url'): string | undefined {
    if (typeof json !== 'object' || json === null || Array.isArray(json)) return undefined;
    const v = (json as Record<string, unknown>)[key];
    return typeof v === 'string' && v.trim() ? v.trim() : undefined;
  }

  private async normalizeFavicon(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer, { failOn: 'error' })
        .png()
        .toBuffer();
    } catch (error) {
      this.logger.warn(
        `Favicon conversion failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'Không thể xử lý favicon. Vui lòng dùng ảnh PNG/JPG/WebP hợp lệ.',
      );
    }
  }

  /** Best-effort delete of a prior uploaded branding file (signed /media URL under shop-branding/). */
  private async tryDeletePriorShopBrandingFile(previousUrl: string | undefined): Promise<void> {
    if (!previousUrl) return;
    let secret: string;
    try {
      secret = resolveMediaSigningSecret(this.config);
    } catch {
      return;
    }
    try {
      const u = new URL(previousUrl);
      const d = u.searchParams.get('d') ?? undefined;
      const s = u.searchParams.get('s') ?? undefined;
      const payload = verifySignedMediaParams(d, s, secret);
      if (!payload?.p.startsWith('shop-branding/')) return;
      await this.storage.deleteFile(payload.p);
    } catch {
      /* ignore malformed URLs or delete failures */
    }
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
    const data: Prisma.ShopUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.is_active !== undefined) data.is_active = dto.is_active;
    if (dto.contact !== undefined) {
      data.contact_json = this.mergeContactJson(oldShop.contact_json, dto.contact);
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

    if (contactChanged) {
      await this.logAudit(id, ShopAuditAction.update_shop, actorUserId ?? null, 'shop', id, {
        field: 'contact_json',
      });
    }

    return updated;
  }

  /**
   * Shop-scoped settings (contact + appearance) for the active tenant.
   * GET: shop_admin or shop_staff. PATCH: shop_admin only (RolesGuard).
   */
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
    return shop;
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
      data.contact_json = this.mergeContactJson(oldShop.contact_json, contact);
    }
    if (appearance !== undefined) {
      data.appearance_json = this.mergeAppearanceJson(oldShop.appearance_json, appearance);
    }
    if (loyalty !== undefined) {
      data.loyalty_json = this.mergeLoyaltyJson(oldShop.loyalty_json, loyalty);
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
      await this.logAudit(tenantId, ShopAuditAction.update_shop, actorUserId ?? null, 'shop', tenantId, {
        field: 'contact_json',
      });
    }
    if (appearanceChanged) {
      await this.logAudit(tenantId, ShopAuditAction.update_shop, actorUserId ?? null, 'shop', tenantId, {
        field: 'appearance_json',
      });
    }
    if (loyaltyChanged) {
      await this.logAudit(tenantId, ShopAuditAction.update_shop, actorUserId ?? null, 'shop', tenantId, {
        field: 'loyalty_json',
      });
    }

    return updated;
  }

  /**
   * Upload logo or favicon file for the active tenant; stores under shop-branding/ and sets appearance_json URL.
   */
  async uploadAppearanceAsset(
    tenantId: string,
    kind: 'logo' | 'favicon',
    file: Express.Multer.File,
    actorUserId?: string | null,
  ) {
    let allowedMimeTypes = this.uploadSupport.resolveAllowedMimeTypes(
      this.logger,
      'image/jpeg,image/png,image/webp',
    );
    allowedMimeTypes = allowedMimeTypes.filter((t) =>
      (SHOP_BRANDING_MIME_ALLOWLIST as readonly string[]).includes(t),
    );
    if (allowedMimeTypes.length === 0) {
      this.logger.warn(
        'ALLOWED_MIME excludes all shop-branding types; using image/jpeg, image/png, image/webp',
      );
      allowedMimeTypes = [...SHOP_BRANDING_MIME_ALLOWLIST];
    }
    const maxUploadBytes = Math.min(
      this.uploadSupport.resolveMaxUploadBytes(this.logger, 2),
      2 * 1024 * 1024,
    );
    try {
      await this.uploadSupport.validateFile(file, allowedMimeTypes, maxUploadBytes);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      this.logger.warn(
        `Branding upload validation failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'File upload không hợp lệ. Vui lòng kiểm tra định dạng và kích thước file.',
      );
    }

    const oldShop = await this.prisma.shop.findFirst({
      where: { id: tenantId, is_active: true },
      select: { id: true, appearance_json: true },
    });
    if (!oldShop) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Shop not found');
    }

    const previousUrl =
      kind === 'logo'
        ? this.extractAppearanceUrl(oldShop.appearance_json, 'logo_url')
        : this.extractAppearanceUrl(oldShop.appearance_json, 'favicon_url');

    let payloadBuffer = file.buffer;
    let ext =
      file.mimetype === 'image/png' ? '.png' : file.mimetype === 'image/webp' ? '.webp' : '.jpg';
    if (kind === 'favicon' && ext !== '.png') {
      // Browser favicon support is most reliable with PNG; normalize uploads here.
      payloadBuffer = await this.normalizeFavicon(file.buffer);
      ext = '.png';
    }
    const filename = `${tenantId}_${kind}_${uuidv7()}${ext}`;
    const relativePath = await this.storage.saveFile(payloadBuffer, filename, 'shop-branding');
    const publicUrl = await this.storage.getFileUrl(relativePath);

    const patch: ShopAppearancePatchDto =
      kind === 'logo' ? { logo_url: publicUrl } : { favicon_url: publicUrl };
    const nextAppearance = this.mergeAppearanceJson(oldShop.appearance_json, patch);
    const appearanceChanged =
      jsonStableStringify(oldShop.appearance_json) !== jsonStableStringify(nextAppearance);

    let updated;
    try {
      updated = await this.prisma.shop.update({
        where: { id: tenantId },
        data: { appearance_json: nextAppearance },
        select: {
          id: true,
          name: true,
          slug: true,
          contact_json: true,
          appearance_json: true,
        },
      });
    } catch (e) {
      await this.storage.deleteFile(relativePath);
      throw e;
    }

    if (appearanceChanged) {
      // Delete prior hosting blob before audit so a rare audit failure cannot skip cleanup.
      await this.tryDeletePriorShopBrandingFile(previousUrl);
      await this.logAudit(tenantId, ShopAuditAction.update_shop, actorUserId ?? null, 'shop', tenantId, {
        field: 'appearance_json',
        via: `upload_${kind}`,
      });
    }

    return {
      kind,
      url: publicUrl,
      shop: updated,
    };
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
