import { Injectable } from '@nestjs/common';
import { CreateShopDto } from './dto/create-shop.dto';
import { QueryShopMembersDto } from './dto/query-shop-members.dto';
import { QueryShopItemsDto } from './dto/query-shop-items.dto';
import { QueryShopAuditLogsDto } from './dto/query-shop-audit-logs.dto';
import { UpdateShopDto, ShopContactPatchDto } from './dto/update-shop.dto';
import { ShopAppearancePatchDto, ShopLoyaltyPatchDto } from './dto/update-shop-appearance.dto';
import { AddShopAdminDto } from './dto/add-shop-admin.dto';
import { ShopsCrudService } from './services/shops-crud.service';
import { ShopsAppearanceService } from './services/shops-appearance.service';
import { ShopsMembersService } from './services/shops-members.service';
import { ShopsAuditService } from './services/shops-audit.service';

@Injectable()
export class ShopsService {
  constructor(
    private readonly crud: ShopsCrudService,
    private readonly appearance: ShopsAppearanceService,
    private readonly members: ShopsMembersService,
    private readonly audit: ShopsAuditService,
  ) {}

  findAll() {
    return this.crud.findAll();
  }

  findOne(id: string) {
    return this.crud.findOne(id);
  }

  create(dto: CreateShopDto) {
    return this.crud.create(dto);
  }

  update(id: string, dto: UpdateShopDto, actorUserId?: string | null) {
    return this.crud.update(id, dto, actorUserId);
  }

  deactivate(id: string, actorUserId?: string | null) {
    return this.crud.deactivate(id, actorUserId);
  }

  getTenantShopSettings(tenantId: string) {
    return this.crud.getTenantShopSettings(tenantId);
  }

<<<<<<< HEAD
  /**
   * Re-sign logo_url / favicon_url so the returned URLs are always fresh.
   * Stored value may be a relative path (new format) or an expired signed URL (legacy).
   */
  private async hydrateAppearanceJson(json: Prisma.JsonValue): Promise<Prisma.JsonValue> {
    if (typeof json !== 'object' || json === null || Array.isArray(json)) return json;
    const obj = json as Record<string, unknown>;
    const result = { ...obj };
    let secret: string | undefined;
    try {
      secret = resolveMediaSigningSecret(this.config);
    } catch { /* ignore */ }
    for (const key of ['logo_url', 'favicon_url']) {
      const stored = result[key];
      if (typeof stored !== 'string' || !stored.trim()) continue;
      const relativePath = extractShopBrandingRelativePath(stored.trim(), secret);
      if (relativePath) {
        result[key] = await this.storage.getFileUrl(relativePath);
      }
    }
    return result as Prisma.JsonValue;
  }

  /**
   * Normalize logo_url / favicon_url in an appearance patch back to relative paths
   * before persisting, so hydrated signed URLs from API responses are never re-stored.
   */
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

  /** Best-effort delete of a prior uploaded branding file. Handles plain relative paths (new) and signed URLs (legacy). */
  private async tryDeletePriorShopBrandingFile(previousUrl: string | undefined): Promise<void> {
    if (!previousUrl) return;
    let relativePath: string | null = null;
    if (!previousUrl.startsWith('http://') && !previousUrl.startsWith('https://')) {
      relativePath = previousUrl.startsWith('shop-branding/') ? previousUrl : null;
    } else {
      let secret: string | undefined;
      try {
        secret = resolveMediaSigningSecret(this.config);
      } catch {
        /* ignore */
      }
      relativePath = extractShopBrandingRelativePath(previousUrl, secret);
    }
    if (!relativePath?.startsWith('shop-branding/')) return;
    try {
      await this.storage.deleteFile(relativePath);
    } catch {
      /* ignore delete failures */
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
    return { ...shop, appearance_json: await this.hydrateAppearanceJson(shop.appearance_json) };
  }

  async updateContactAndAppearanceForTenant(
=======
  updateContactAndAppearanceForTenant(
>>>>>>> 232a834 (refactor(shops): split god-file shops.service.ts into domain sub-services)
    tenantId: string,
    contact?: ShopContactPatchDto,
    appearance?: ShopAppearancePatchDto,
    actorUserId?: string | null,
    loyalty?: ShopLoyaltyPatchDto,
  ) {
<<<<<<< HEAD
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
      let normSecret: string | undefined;
      try { normSecret = resolveMediaSigningSecret(this.config); } catch { /* ignore */ }
      data.appearance_json = this.mergeAppearanceJson(
        oldShop.appearance_json,
        this.normalizeAppearancePatch(appearance, normSecret),
      );
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

    return { ...updated, appearance_json: await this.hydrateAppearanceJson(updated.appearance_json) };
=======
    return this.crud.updateContactAndAppearanceForTenant(tenantId, contact, appearance, actorUserId, loyalty);
>>>>>>> 232a834 (refactor(shops): split god-file shops.service.ts into domain sub-services)
  }

  uploadAppearanceAsset(
    tenantId: string,
    kind: 'logo' | 'favicon',
    file: Express.Multer.File,
    actorUserId?: string | null,
  ) {
<<<<<<< HEAD
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

    // Store the relative path (not the signed URL) so it never expires in the DB.
    const patch: ShopAppearancePatchDto =
      kind === 'logo' ? { logo_url: relativePath } : { favicon_url: relativePath };
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

    const hydratedAppearance = await this.hydrateAppearanceJson(updated.appearance_json);
    const urlKey = kind === 'logo' ? 'logo_url' : 'favicon_url';
    const freshUrl = (hydratedAppearance as Record<string, unknown>)[urlKey];
    return {
      kind,
      url: typeof freshUrl === 'string' ? freshUrl : await this.storage.getFileUrl(relativePath),
      shop: { ...updated, appearance_json: hydratedAppearance },
    };
=======
    return this.appearance.uploadAppearanceAsset(tenantId, kind, file, actorUserId);
>>>>>>> 232a834 (refactor(shops): split god-file shops.service.ts into domain sub-services)
  }

  findMembers(shopId: string, query: QueryShopMembersDto) {
    return this.members.findMembers(shopId, query);
  }

  findItems(shopId: string, query: QueryShopItemsDto) {
    return this.crud.findItems(shopId, query);
  }

  addShopAdmin(shopId: string, dto: AddShopAdminDto, actorUserId?: string | null) {
    return this.members.addShopAdmin(shopId, dto, actorUserId);
  }

  resetMemberPassword(
    shopId: string,
    memberUserId: string,
    plainPassword: string,
    actorUserId?: string | null,
  ) {
    return this.members.resetMemberPassword(shopId, memberUserId, plainPassword, actorUserId);
  }

  setMemberAccountActive(
    shopId: string,
    memberUserId: string,
    is_active: boolean,
    actorUserId?: string | null,
  ) {
    return this.members.setMemberAccountActive(shopId, memberUserId, is_active, actorUserId);
  }

  findAuditLogs(shopId: string, query: QueryShopAuditLogsDto) {
    return this.audit.getAuditLogs(shopId, query);
  }
}
