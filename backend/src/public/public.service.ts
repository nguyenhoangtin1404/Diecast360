import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { IStorageService } from '../storage/storage.interface';
import { resolveMediaSigningSecret } from '../common/media/media-signing-secret';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { QueryPublicItemsDto } from './dto/query-public-items.dto';
import { Prisma } from '../generated/prisma/client';
import { toNumber } from '../common/utils/decimal.utils';
import { totalPagesFromCount } from '../common/utils/pagination.utils';
import { parseShopContactJson, ShopContactSettings } from '../shops/types/shop-contact.types';
import { parseShopAppearanceJson } from '../shops/types/shop-appearance.types';
import { extractShopBrandingRelativePath } from '../common/media/resolve-receipt-logo-url';

@Injectable()
export class PublicService {
  private readonly countCacheTtlMs = 30_000;
  private readonly countCache = new Map<
    string,
    { total: number; expiresAt: number }
  >();

  constructor(
    private prisma: PrismaService,
    @Inject('IStorageService') private storage: IStorageService,
    private config: ConfigService,
  ) {}

  private defaultContact(shopName: string): ShopContactSettings {
    return {
      page_title: 'Liên hệ với chúng tôi',
      page_subtitle: 'Chúng tôi luôn sẵn sàng hỗ trợ và giải đáp mọi thắc mắc của bạn',
      phone: {
        title: 'Điện thoại',
        label: '',
        tel: '',
        hint: 'Gọi ngay để được tư vấn',
      },
      facebook: {
        title: 'Facebook',
        url: '',
        label: '',
        hint: 'Theo dõi chúng tôi trên Facebook',
      },
      zalo: {
        title: 'Zalo',
        url: '',
        label: '',
        hint: 'Chat với chúng tôi trên Zalo',
      },
      hours: {
        title: 'Thời gian làm việc',
        schedule_line: `**${shopName}** — cập nhật giờ mở cửa tại trang quản trị shop.`,
        footer_note: 'Chúng tôi luôn sẵn sàng phục vụ bạn!',
      },
    };
  }

  private mergeWithDefaults(shopName: string, stored: ShopContactSettings): ShopContactSettings {
    const d = this.defaultContact(shopName);
    return {
      page_title: stored.page_title ?? d.page_title,
      page_subtitle: stored.page_subtitle ?? d.page_subtitle,
      phone: { ...d.phone, ...stored.phone },
      facebook: { ...d.facebook, ...stored.facebook },
      zalo: { ...d.zalo, ...stored.zalo },
      hours: { ...d.hours, ...stored.hours },
    };
  }

  async getShopContact(canonicalShopId: string) {
    const shop = await this.prisma.shop.findFirst({
      where: { id: canonicalShopId, is_active: true },
      select: {
        id: true,
        name: true,
        slug: true,
        contact_json: true,
        appearance_json: true,
      },
    });
    if (!shop) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Shop not found');
    }
    const stored = parseShopContactJson(shop.contact_json);
    const contact = this.mergeWithDefaults(shop.name, stored);
    const appearance = parseShopAppearanceJson(shop.appearance_json);
    let mediaSecret: string | undefined;
    try {
      mediaSecret = resolveMediaSigningSecret(this.config);
    } catch { /* ignore */ }
    for (const key of ['logo_url', 'favicon_url'] as const) {
      const val = appearance[key];
      if (!val) continue;
      const rel = extractShopBrandingRelativePath(val, mediaSecret);
      if (rel) appearance[key] = await this.storage.getFileUrl(rel);
    }
    return {
      shop: { id: shop.id, name: shop.name, slug: shop.slug },
      contact,
      appearance,
    };
  }

  private buildCountCacheKey(where: Prisma.ItemWhereInput): string {
    // Truncate Date objects to minute precision so the key is stable within the
    // cache TTL window (prevents a new cache miss on every millisecond tick).
    return JSON.stringify(where, (_, value) => {
      if (value instanceof Date) {
        return new Date(Math.floor(value.getTime() / 60_000) * 60_000).toISOString();
      }
      return value;
    });
  }

  private async getCachedTotal(where: Prisma.ItemWhereInput): Promise<number> {
    const key = this.buildCountCacheKey(where);
    const now = Date.now();
    const cached = this.countCache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.total;
    }

    const total = await this.prisma.item.count({ where });
    this.countCache.set(key, {
      total,
      expiresAt: now + this.countCacheTtlMs,
    });
    return total;
  }

  async findAll(queryDto: QueryPublicItemsDto, tenantId?: string | null) {
    const page = queryDto.page ?? 1;
    const pageSize = Math.min(queryDto.page_size ?? 20, 100);
    const skip = (page - 1) * pageSize;

    const where: Prisma.ItemWhereInput = {
      deleted_at: null,
      is_public: true,
      ...(tenantId ? { shop_id: tenantId } : {}),
    };

    if (queryDto.status) {
      where.status = queryDto.status;
    }

    const normalizedQuery = queryDto.q?.trim();
    if (normalizedQuery) {
      where.name = {
        contains: normalizedQuery,
        mode: 'insensitive',
      };
    }

    const normalizedCarBrand = queryDto.car_brand?.trim();
    if (normalizedCarBrand) {
      where.car_brand = normalizedCarBrand;
    }

    const normalizedModelBrand = queryDto.model_brand?.trim();
    if (normalizedModelBrand) {
      where.model_brand = normalizedModelBrand;
    }

    if (queryDto.condition) {
      where.condition = queryDto.condition;
    }

    if (queryDto.preorder_open === true) {
      where.status = 'preorder';
      where.OR = [
        { preorder_closes_at: null },
        { preorder_closes_at: { gt: new Date() } },
      ];
    }

    // Build deterministic orderBy (stable pagination when values tie)
    const sortBy: 'name' | 'price' | 'created_at' = queryDto.sort_by ?? 'created_at';
    const sortOrder: Prisma.SortOrder = queryDto.sort_order ?? 'desc';
    let primaryOrderBy: Prisma.ItemOrderByWithRelationInput;
    let orderBy: Prisma.ItemOrderByWithRelationInput[];

    if (sortBy === 'name') {
      primaryOrderBy = { name: sortOrder };
      orderBy = [primaryOrderBy, { created_at: 'desc' }, { id: 'desc' }];
    } else if (sortBy === 'price') {
      if (queryDto.preorder_open === true) {
        // When browsing open preorders the displayed price is preorder_price,
        // so sort by that first (items without preorder_price fall back to price).
        orderBy = [
          { preorder_price: { sort: sortOrder, nulls: 'last' } },
          { price: sortOrder },
          { created_at: 'desc' },
          { id: 'desc' },
        ];
      } else {
        primaryOrderBy = { price: sortOrder };
        orderBy = [primaryOrderBy, { created_at: 'desc' }, { id: 'desc' }];
      }
    } else {
      primaryOrderBy = { created_at: sortOrder };
      orderBy = [primaryOrderBy, { id: sortOrder }];
    }

    const [items, total] = await Promise.all([
      this.prisma.item.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          item_images: {
            // Prefer cover image; fallback to first display_order image when cover is missing.
            orderBy: [{ is_cover: 'desc' }, { display_order: 'asc' }],
            take: 1,
          },
          spin_sets: {
            where: { is_default: true },
            take: 1,
            include: {
              frames: {
                orderBy: { frame_index: 'asc' },
                // A single frame is sufficient to derive has_spinner in list view.
                take: 1,
              },
            },
          },
        },
      }),
      this.getCachedTotal(where),
    ]);

    const itemsWithMeta = await Promise.all(
      items.map(async (item) => {
        const coverImage = item.item_images[0] ?? null;
        const defaultSpinSet = item.spin_sets[0] ?? null;

        return {
          id: item.id,
          name: item.name,
          description: item.description,
          scale: item.scale,
          brand: item.brand,
          car_brand: item.car_brand || null,
          model_brand: item.model_brand || null,
          condition: item.condition || null,
          price: toNumber(item.price),
          original_price: toNumber(item.original_price),
          preorder_price: toNumber(item.preorder_price),
          status: item.status,
          is_public: item.is_public,
          cover_image_url: coverImage
            ? await this.storage.getFileUrl(coverImage.file_path)
            : null,
          has_spinner: Boolean(defaultSpinSet && defaultSpinSet.frames.length > 0),
          preorder_closes_at: item.preorder_closes_at ?? null,
          preorder_opens_at: item.preorder_opens_at ?? item.created_at,
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
      }),
    );

    return {
      items: itemsWithMeta,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: totalPagesFromCount(total, pageSize),
      },
    };
  }

  async findOne(id: string, tenantId?: string | null) {
    const item = await this.prisma.item.findFirst({
      where: {
        id,
        deleted_at: null,
        is_public: true,
        ...(tenantId ? { shop_id: tenantId } : {}),
      },
      include: {
        item_images: {
          orderBy: { display_order: 'asc' },
        },
        spin_sets: {
          where: { is_default: true },
          take: 1,
          include: {
            frames: {
              orderBy: { frame_index: 'asc' },
            },
          },
        },
      },
    });

    if (!item) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Item not found or not public');
    }

    const { item_images, spin_sets, ...itemData } = item;

    const defaultSpinSet = spin_sets[0] || null;
    const normalizedImages = item_images.filter((img) => Boolean(img.file_path?.trim()));
    const normalizedFrames = (defaultSpinSet?.frames ?? []).filter((frame) =>
      Boolean(frame.file_path?.trim()),
    );

    const images = await Promise.all(
      normalizedImages.map(async (img) => ({
        id: img.id,
        item_id: img.item_id,
        url: await this.storage.getFileUrl(img.file_path),
        thumbnail_url: img.thumbnail_path
          ? await this.storage.getFileUrl(img.thumbnail_path)
          : null,
        is_cover: img.is_cover,
        display_order: img.display_order,
        created_at: img.created_at,
      })),
    );

    const frames =
      defaultSpinSet != null
        ? await Promise.all(
            normalizedFrames.map(async (frame) => ({
              id: frame.id,
              spin_set_id: frame.spin_set_id,
              frame_index: frame.frame_index,
              image_url: await this.storage.getFileUrl(frame.file_path),
              thumbnail_url: frame.thumbnail_path
                ? await this.storage.getFileUrl(frame.thumbnail_path)
                : null,
              created_at: frame.created_at,
            })),
          )
        : [];

    return {
      item: {
        ...itemData,
        price: toNumber(itemData.price),
        original_price: toNumber(itemData.original_price),
      },
      images,
      spinner: defaultSpinSet
        ? {
            id: defaultSpinSet.id,
            item_id: defaultSpinSet.item_id,
            label: defaultSpinSet.label,
            is_default: defaultSpinSet.is_default,
            frames,
            created_at: defaultSpinSet.created_at,
            updated_at: defaultSpinSet.updated_at,
          }
        : null,
    };
  }
}

