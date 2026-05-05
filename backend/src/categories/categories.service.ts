import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';
import { isUUID } from 'class-validator';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { isPrismaUniqueConstraintError } from '../common/prisma/prisma-error.utils';
import { normalizeCategoryBrandField } from '../common/utils/category-brand.utils';

/**
 * Maps category type to the corresponding field on the Item model.
 */
const CATEGORY_TYPE_TO_ITEM_FIELD: Record<string, string> = {
  car_brand: 'car_brand',
  model_brand: 'model_brand',
};

export interface CategoriesListContext {
  /** JWT active shop (optional). */
  jwtTenantId?: string | null;
  isPlatformSuper?: boolean;
}

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * List categories for dropdowns / filters.
   * - With `?shop_id=` (UUID or slug): global seed rows + that shop's rows.
   * - Authenticated shop user without query: global + active JWT shop.
   * - Platform super without shop filter: all rows.
   * - Anonymous without shop: global seed only (backward compatible).
   */
  async findAll(queryDto: QueryCategoriesDto, ctx: CategoriesListContext = {}) {
    const shopScope = await this.resolveCategoryListShopScope(queryDto.shop_id, ctx);

    const where: Prisma.CategoryWhereInput = {};

    if (shopScope.mode === 'shop_merge' && shopScope.shopIds.length > 0) {
      where.OR = [
        { shop_id: null },
        { shop_id: { in: shopScope.shopIds } },
      ];
    }

    if (queryDto.type) {
      where.type = queryDto.type;
    }

    if (queryDto.is_active !== undefined) {
      where.is_active = queryDto.is_active;
    }

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
    });

    return { categories };
  }

  private async resolveCategoryListShopScope(
    rawShopId: string | undefined,
    ctx: CategoriesListContext,
  ): Promise<{ mode: 'all' | 'global_only' | 'shop_merge'; shopIds: string[] }> {
    const trimmed = rawShopId?.trim();
    if (trimmed) {
      const id = await this.resolveShopIdFromQuery(trimmed);
      return { mode: 'shop_merge', shopIds: id ? [id] : [] };
    }

    if (ctx.isPlatformSuper) {
      return { mode: 'all', shopIds: [] };
    }

    const jwtShop =
      typeof ctx.jwtTenantId === 'string' && ctx.jwtTenantId.trim().length > 0
        ? ctx.jwtTenantId.trim()
        : null;
    if (jwtShop) {
      return { mode: 'shop_merge', shopIds: [jwtShop] };
    }

    return { mode: 'global_only', shopIds: [] };
  }

  /** Resolve public/admin `shop_id` query param (UUID or slug) to canonical shop UUID. */
  private async resolveShopIdFromQuery(trimmed: string): Promise<string | null> {
    const shop = isUUID(trimmed)
      ? await this.prisma.shop.findFirst({
          where: { id: trimmed, is_active: true },
          select: { id: true },
        })
      : await this.prisma.shop.findFirst({
          where: { slug: trimmed, is_active: true },
          select: { id: true },
        });
    return shop?.id ?? null;
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    return { category };
  }

  /** Platform seed / global catalog (shop_id = null). */
  async createGlobal(dto: CreateCategoryDto) {
    return this.createWithShopId(dto, null);
  }

  /** Shop-scoped category (AI import quick-add, shop admin). */
  async createForShop(dto: CreateCategoryDto, shopId: string) {
    return this.createWithShopId(dto, shopId);
  }

  private async createWithShopId(dto: CreateCategoryDto, shopId: string | null) {
    const existing = await this.prisma.category.findFirst({
      where: {
        type: dto.type,
        name: dto.name,
        shop_id: shopId,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Danh mục "${dto.name}" đã tồn tại trong loại "${dto.type}"`,
      );
    }

    let displayOrder = dto.display_order;
    if (displayOrder === undefined) {
      const maxOrder = await this.prisma.category.aggregate({
        where: { type: dto.type, shop_id: shopId },
        _max: { display_order: true },
      });
      displayOrder = (maxOrder._max.display_order ?? -1) + 1;
    }

    const category = await this.prisma.category.create({
      data: {
        shop_id: shopId,
        name: dto.name,
        type: dto.type,
        display_order: displayOrder,
      },
    });

    this.logger.log(
      `Category created: ${category.name} (${category.type}) shop=${shopId ?? 'global'}`,
    );

    return { category };
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
    opts: { tenantId?: string | null; isPlatformSuper?: boolean },
  ) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    this.assertCanMutateCategory(existing.shop_id, opts);

    const isRenaming = dto.name && dto.name !== existing.name;

    if (isRenaming) {
      const duplicate = await this.prisma.category.findFirst({
        where: {
          type: existing.type,
          name: dto.name!,
          shop_id: existing.shop_id,
          NOT: { id: existing.id },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          `Danh mục "${dto.name}" đã tồn tại trong loại "${existing.type}"`,
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.display_order !== undefined) data.display_order = dto.display_order;

    const itemField = CATEGORY_TYPE_TO_ITEM_FIELD[existing.type];
    if (!itemField) {
      throw new ConflictException(
        `Loại danh mục "${existing.type}" không có ánh xạ trường hợp lệ`,
      );
    }

    if (isRenaming) {
      const itemWhere: Prisma.ItemWhereInput = {
        [itemField]: existing.name,
        deleted_at: null,
      };
      if (existing.shop_id !== null) {
        itemWhere.shop_id = existing.shop_id;
      }

      const [category] = await this.prisma.$transaction([
        this.prisma.category.update({ where: { id }, data }),
        this.prisma.item.updateMany({
          where: itemWhere,
          data: { [itemField]: dto.name },
        }),
      ]);

      const updatedCount = await this.prisma.item.count({
        where: {
          [itemField]: dto.name,
          deleted_at: null,
          ...(existing.shop_id !== null ? { shop_id: existing.shop_id } : {}),
        },
      });

      this.logger.log(
        `Category renamed: "${existing.name}" → "${dto.name}" (${existing.type}), ${updatedCount} items updated`,
      );

      return { category };
    }

    const category = await this.prisma.category.update({
      where: { id },
      data,
    });

    return { category };
  }

  async toggleActive(id: string, opts: { tenantId?: string | null; isPlatformSuper?: boolean }) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    this.assertCanMutateCategory(existing.shop_id, opts);

    const category = await this.prisma.category.update({
      where: { id },
      data: { is_active: !existing.is_active },
    });

    this.logger.log(
      `Category toggled: ${category.name} → ${category.is_active ? 'active' : 'inactive'}`,
    );

    return { category };
  }

  async remove(id: string, opts: { tenantId?: string | null; isPlatformSuper?: boolean }) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Danh mục không tồn tại');
    }

    this.assertCanMutateCategory(existing.shop_id, opts);

    const itemField = CATEGORY_TYPE_TO_ITEM_FIELD[existing.type];
    if (!itemField) {
      throw new ConflictException(
        `Loại danh mục "${existing.type}" không có ánh xạ trường hợp lệ`,
      );
    }

    const usageWhere: Prisma.ItemWhereInput = {
      [itemField]: existing.name,
      deleted_at: null,
    };
    if (existing.shop_id !== null) {
      usageWhere.shop_id = existing.shop_id;
    }

    const usageCount = await this.prisma.item.count({
      where: usageWhere,
    });

    if (usageCount > 0) {
      throw new ConflictException(
        `Không thể xoá danh mục "${existing.name}" vì đang được sử dụng bởi ${usageCount} sản phẩm`,
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    this.logger.log(`Category deleted: ${existing.name} (${existing.type})`);

    return { message: 'Đã xoá danh mục thành công' };
  }

  /**
   * AI item create: ensure shop-scoped Category rows for car/model brand strings.
   * Does not modify global (shop_id null) seed rows.
   */
  async ensureCategoriesForAiImportInTx(
    tx: Prisma.TransactionClient,
    shopId: string,
    carBrand?: string | null,
    modelBrand?: string | null,
  ) {
    const specs: Array<{ type: 'car_brand' | 'model_brand'; value?: string | null }> = [
      { type: 'car_brand', value: carBrand },
      { type: 'model_brand', value: modelBrand },
    ];

    for (const spec of specs) {
      const trimmed =
        typeof spec.value === 'string' ? spec.value.trim() : '';
      if (!trimmed) continue;

      const existingShop = await tx.category.findFirst({
        where: { type: spec.type, name: trimmed, shop_id: shopId },
      });
      const existingGlobal = await tx.category.findFirst({
        where: { type: spec.type, name: trimmed, shop_id: null },
      });
      const existing = existingShop ?? existingGlobal;

      if (!existing) {
        const maxOrder = await tx.category.aggregate({
          where: { type: spec.type, shop_id: shopId },
          _max: { display_order: true },
        });
        const displayOrder = (maxOrder._max.display_order ?? -1) + 1;

        try {
          await tx.category.create({
            data: {
              shop_id: shopId,
              name: trimmed,
              type: spec.type,
              is_active: true,
              display_order: displayOrder,
            },
          });
        } catch (error) {
          if (!isPrismaUniqueConstraintError(error)) {
            throw error;
          }
          const afterRace = await tx.category.findFirst({
            where: { type: spec.type, name: trimmed, shop_id: shopId },
          });
          if (afterRace && !afterRace.is_active) {
            await tx.category.update({
              where: { id: afterRace.id },
              data: { is_active: true },
            });
          }
        }
        continue;
      }

      if (!existing.is_active && existing.shop_id === shopId) {
        await tx.category.update({
          where: { id: existing.id },
          data: { is_active: true },
        });
      }
    }
  }

  async validateCategoryMetadataForShop(
    shopId: string,
    carBrand?: string | null,
    modelBrand?: string | null,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const checks: Array<{ type: 'car_brand' | 'model_brand'; value?: string | null }> = [
      { type: 'car_brand', value: carBrand },
      { type: 'model_brand', value: modelBrand },
    ];

    for (const check of checks) {
      const normalized = normalizeCategoryBrandField(check.value);
      if (!normalized) continue;

      const shopCat = await db.category.findFirst({
        where: {
          type: check.type,
          name: normalized,
          shop_id: shopId,
          is_active: true,
        },
      });
      const globalCat =
        shopCat ??
        (await db.category.findFirst({
          where: {
            type: check.type,
            name: normalized,
            shop_id: null,
            is_active: true,
          },
        }));

      if (!globalCat) {
        throw new AppException(
          ErrorCode.ITEM_CATEGORY_INVALID,
          `Invalid ${check.type} value "${normalized}". Category must exist and be active.`,
          [{ type: check.type, value: normalized }],
        );
      }
    }
  }

  private assertCanMutateCategory(
    categoryShopId: string | null,
    opts: { tenantId?: string | null; isPlatformSuper?: boolean },
  ) {
    if (opts.isPlatformSuper) {
      return;
    }
    if (categoryShopId === null) {
      throw new ForbiddenException('Chỉ quản trị nền tảng mới sửa được danh mục chung.');
    }
    const tid =
      typeof opts.tenantId === 'string' && opts.tenantId.trim().length > 0
        ? opts.tenantId.trim()
        : null;
    if (!tid || tid !== categoryShopId) {
      throw new ForbiddenException('Không có quyền thao tác danh mục của shop khác.');
    }
  }
}
