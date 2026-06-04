import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ErrorCode, AppException } from '../../common/exceptions/http-exception.filter';
import { ShopAuditAction } from '../../generated/prisma/client';
import { IStorageService } from '../../storage/storage.interface';
import { UploadSupportService } from '../../common/upload/upload-support.service';
import { resolveMediaSigningSecret } from '../../common/media/media-signing-secret';
import { extractShopBrandingRelativePath } from '../../common/media/resolve-receipt-logo-url';
import { jsonStableStringify } from '../json-stable-stringify';
import { hydrateAppearanceJson } from '../utils/hydrate-appearance';
import { mergeAppearanceJson } from '../utils/merge-shop-json';
import { ShopsAuditService } from './shops-audit.service';
import { v7 as uuidv7 } from 'uuid';
import * as sharp from 'sharp';
import { Prisma } from '../../generated/prisma/client';

const SHOP_BRANDING_MIME_ALLOWLIST = ['image/jpeg', 'image/png', 'image/webp'] as const;

@Injectable()
export class ShopsAppearanceService {
  private readonly logger = new Logger(ShopsAppearanceService.name);

  constructor(
    private prisma: PrismaService,
    @Inject('IStorageService') private storage: IStorageService,
    private readonly uploadSupport: UploadSupportService,
    private readonly config: ConfigService,
    private readonly audit: ShopsAuditService,
  ) {}

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

  private async hydrateAppearanceJson(json: Prisma.JsonValue): Promise<Prisma.JsonValue> {
    return hydrateAppearanceJson(json, this.storage, this.config);
  }

  /** Best-effort delete of a prior uploaded branding file. Handles plain relative paths (new) and signed URLs (legacy). */
  async tryDeletePriorShopBrandingFile(previousUrl: string | undefined): Promise<void> {
    if (!previousUrl) return;
    let relativePath: string | null = null;
    if (!previousUrl.startsWith('http://') && !previousUrl.startsWith('https://')) {
      relativePath = previousUrl.startsWith('shop-branding/') ? previousUrl : null;
    } else {
      let secret: string | undefined;
      try {
        secret = resolveMediaSigningSecret(this.config);
      } catch { /* ignore */ }
      relativePath = extractShopBrandingRelativePath(previousUrl, secret);
    }
    if (!relativePath?.startsWith('shop-branding/')) return;
    try {
      await this.storage.deleteFile(relativePath);
    } catch {
      /* ignore delete failures */
    }
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
      payloadBuffer = await this.normalizeFavicon(file.buffer);
      ext = '.png';
    }
    const filename = `${tenantId}_${kind}_${uuidv7()}${ext}`;
    const relativePath = await this.storage.saveFile(payloadBuffer, filename, 'shop-branding');

    // Store the relative path (not the signed URL) so it never expires in the DB.
    const patch = kind === 'logo' ? { logo_url: relativePath } : { favicon_url: relativePath };
    const nextAppearance = mergeAppearanceJson(oldShop.appearance_json, patch);
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
      await this.tryDeletePriorShopBrandingFile(previousUrl);
      await this.audit.createAuditLog(tenantId, ShopAuditAction.update_shop, actorUserId ?? null, 'shop', tenantId, {
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
  }
}
