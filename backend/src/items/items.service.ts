import { Injectable, Inject, Logger } from '@nestjs/common';
import { Prisma, ItemStatus } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { IStorageService } from '../storage/storage.interface';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { VectorStoreService } from '../ai/vector-store.service';
import { EmbeddingService, EmbeddingUnavailableError } from '../ai/embedding.service';
import { QueryItemsDto } from './dto/query-items.dto';
import type { VectorSyncItem, ItemWithCoverImage, CsvFieldValue } from '../common/types/item.types';
import { toNumber } from '../common/utils/decimal.utils';
import { FacebookGraphService } from '../integrations/facebook/facebook-graph.service';
import { FacebookConfigService } from '../integrations/facebook/facebook-config.service';
import { PublishFacebookPostDto } from './dto/publish-facebook-post.dto';
import type { ItemAttributesInput } from './dto/item-attributes.validator';

const ALLOWED_STATUS_TRANSITIONS: Record<ItemStatus, ItemStatus[]> = {
  con_hang: ['con_hang', 'giu_cho', 'da_ban'],
  giu_cho: ['giu_cho', 'con_hang', 'da_ban'],
  da_ban: ['da_ban'],
};

function getInitialQuantityForStatus(status: ItemStatus): number {
  return status === 'da_ban' ? 0 : 1;
}

function toItemAttributesJson(attributes: ItemAttributesInput): Prisma.InputJsonObject {
  return attributes as Prisma.InputJsonObject;
}

function resolveQuantityForStatus(status: ItemStatus, requestedQuantity?: number): number {
  if (status === 'da_ban') {
    return 0;
  }

  return requestedQuantity ?? getInitialQuantityForStatus(status);
}

@Injectable()
export class ItemsService {
  private readonly logger = new Logger(ItemsService.name);
  private readonly vectorRetryDelayMs = 5 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
    @Inject('IStorageService') private storage: IStorageService,
    private vectorStore: VectorStoreService,
    private embeddingService: EmbeddingService,
    // FacebookModule is always imported in ItemsModule, so these services are
    // always available. @Optional() was removed — use fbConfig.isConfigured()
    // to detect whether the feature is enabled instead of null-checking the service.
    private facebookGraph: FacebookGraphService,
    private fbConfig: FacebookConfigService,
  ) {}

  /**
   * Every admin item query/mutation must be scoped to exactly one shop.
   * Without a non-empty tenant id, Prisma would match rows from all shops.
   */
  private requireActiveShopId(tenantId: string | undefined | null): string {
    if (typeof tenantId !== 'string' || tenantId.trim().length === 0) {
      throw new AppException(
        ErrorCode.AUTH_FORBIDDEN,
        'Active shop context is required for this operation.',
      );
    }
    return tenantId.trim();
  }

  async syncVectorStore(item: VectorSyncItem) {
    try {
      if (!item.is_public || item.deleted_at) {
        await this.vectorStore.deleteItem(item.id);
        await this.clearVectorSyncPending(item.id);
        return;
      }

      const textToEmbed = `Name: ${item.name}
Description: ${item.description || ''}
Brand: ${item.brand || ''}
Car Brand: ${item.car_brand || ''}
Scale: ${item.scale}
Condition: ${item.condition || ''}`;

      const embedding = await this.embeddingService.getEmbedding(textToEmbed);
      if (embedding.length > 0) {
        await this.vectorStore.upsertItem(item.id, embedding, {
          name: item.name,
          category: 'item',
        });
        await this.clearVectorSyncPending(item.id);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      await this.markVectorSyncPending(item.id, err.message);
      if (err instanceof EmbeddingUnavailableError) {
        this.logger.warn(
          `Skipping vector sync for item ${item.id} because embeddings are unavailable: ${err.message}`,
        );
        return;
      }
      this.logger.error(
        `Failed to sync item ${item.id} with vector store: ${err.message}`,
        err.stack,
      );
    }
  }

  async search(query: string, tenantId: string, limit: number = 20) {
    const shopId = this.requireActiveShopId(tenantId);
    // Try vector/semantic search first, fallback to text search
    try {
      const embedding = await this.embeddingService.getEmbedding(query);
      if (!embedding.length) {
        return this.findAll({ q: query, page: 1, page_size: limit }, shopId);
      }

      const ids = await this.vectorStore.search(embedding, limit);

      if (ids.length === 0) {
        // No vector results - fallback to text search
        return this.findAll({ q: query, page: 1, page_size: limit }, shopId);
      }

      const items = await this.prisma.item.findMany({
        where: {
          id: { in: ids },
          deleted_at: null,
          shop_id: shopId,
        },
        include: {
          item_images: {
            where: { is_cover: true },
            take: 1,
          },
        },
      });

      // Sort items by the order returned from vector store
      const idMap = new Map(items.map(item => [item.id, item]));
      const sortedItems = ids
        .map(id => idMap.get(id))
        .filter(item => item !== undefined);

      const itemsWithCover = sortedItems.map((item) => {
        const itemWithImages = item as ItemWithCoverImage;
        return {
          ...itemWithImages,
          price: toNumber(itemWithImages.price),
          original_price: toNumber(itemWithImages.original_price),
          cover_image_url: itemWithImages.item_images[0]
            ? this.getImageUrl(itemWithImages.item_images[0].file_path)
            : null,
          item_images: undefined,
        };
      });

      return {
        items: itemsWithCover,
        pagination: {
          page: 1,
          page_size: limit,
          total: itemsWithCover.length,
          total_pages: 1,
        },
      };
    } catch (error) {
      // Vector search unavailable (no API key, Pinecone down, etc.) - fallback to text search
      const err = error instanceof Error ? error : new Error(String(error));
      if (err instanceof EmbeddingUnavailableError) {
        this.logger.warn(`Vector search unavailable, falling back to text search: ${err.message}`);
      } else {
        this.logger.error(
          `Vector search failed, falling back to text search: ${err.message}`,
          err.stack,
        );
      }
      return this.findAll({ q: query, page: 1, page_size: limit }, shopId);
    }
  }

  async findAll(queryDto: QueryItemsDto, tenantId: string) {
    const shopId = this.requireActiveShopId(tenantId);
    const page = queryDto.page || 1;
    const pageSize = queryDto.page_size || 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ItemWhereInput = {
      deleted_at: null,
      shop_id: shopId,
    };

    if (queryDto.status) {
      where.status = queryDto.status;
    }

    if (queryDto.is_public !== undefined) {
      where.is_public = queryDto.is_public;
    }

    if (queryDto.q) {
      where.name = {
        contains: queryDto.q,
        mode: 'insensitive',
      };
    }

    if (queryDto.car_brand) {
      where.car_brand = queryDto.car_brand;
    }

    if (queryDto.model_brand) {
      where.model_brand = queryDto.model_brand;
    }

    if (queryDto.condition) {
      where.condition = queryDto.condition;
    }

    if (queryDto.fb_status === 'posted') {
      where.facebook_posts = { some: {} };
    } else if (queryDto.fb_status === 'not_posted') {
      where.facebook_posts = { none: {} };
    }

    const [items, total] = await Promise.all([
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
          spin_sets: {
            where: { is_default: true },
            take: 1,
          },
          facebook_posts: {
            orderBy: { posted_at: 'desc' },
            take: 1,
          },
          _count: {
            select: { facebook_posts: true },
          },
        },
      }),
      this.prisma.item.count({ where }),
    ]);

    const itemsWithCover = items.map((item) => ({
      ...item,
      price: toNumber(item.price),
      original_price: toNumber(item.original_price),
      cover_image_url: item.item_images[0]
        ? this.getImageUrl(item.item_images[0].file_path)
        : null,
      has_default_spin_set: item.spin_sets.length > 0,
      fb_post_url: item.facebook_posts[0]?.post_url || null,
      fb_posted_at: item.facebook_posts[0]?.posted_at || null,
      fb_posts_count: item._count.facebook_posts,
      item_images: undefined,
      spin_sets: undefined,
      facebook_posts: undefined,
      _count: undefined,
    }));

    return {
      items: itemsWithCover,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    };
  }

  async findOne(id: string, tenantId: string) {
    const shopId = this.requireActiveShopId(tenantId);
    const item = await this.prisma.item.findFirst({
      where: {
        id,
        deleted_at: null,
        shop_id: shopId,
      },
      include: {
        item_images: {
          orderBy: { display_order: 'asc' },
        },
        spin_sets: {
          include: {
            frames: {
              orderBy: { frame_index: 'asc' },
            },
          },
        },
        facebook_posts: {
          orderBy: { posted_at: 'desc' },
        },
      },
    });

    if (!item) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
    }

    const { item_images, spin_sets, facebook_posts, ...itemData } = item;

    const priceValue = itemData.price as unknown as { toNumber?: () => number } | number | null;
    const originalPriceValue = itemData.original_price as unknown as { toNumber?: () => number } | number | null;

    return {
      item: {
        ...itemData,
        price: priceValue != null ? (typeof (priceValue as { toNumber?: () => number }).toNumber === 'function' ? (priceValue as { toNumber: () => number }).toNumber() : Number(priceValue)) : null,
        original_price: originalPriceValue != null ? (typeof (originalPriceValue as { toNumber?: () => number }).toNumber === 'function' ? (originalPriceValue as { toNumber: () => number }).toNumber() : Number(originalPriceValue)) : null,
      },
      images: item_images.map((img) => ({
        id: img.id,
        item_id: img.item_id,
        url: this.getImageUrl(img.file_path),
        thumbnail_url: img.thumbnail_path ? this.getImageUrl(img.thumbnail_path) : null,
        is_cover: img.is_cover,
        display_order: img.display_order,
        created_at: img.created_at,
      })),
      spin_sets: spin_sets.map((set) => ({
        id: set.id,
        item_id: set.item_id,
        label: set.label,
        is_default: set.is_default,
        frames: set.frames.map((frame) => ({
          id: frame.id,
          spin_set_id: frame.spin_set_id,
          frame_index: frame.frame_index,
          image_url: this.getImageUrl(frame.file_path),
          thumbnail_url: frame.thumbnail_path ? this.getImageUrl(frame.thumbnail_path) : null,
          created_at: frame.created_at,
        })),
        created_at: set.created_at,
        updated_at: set.updated_at,
      })),
      facebook_posts,
    };
  }

  async create(createDto: CreateItemDto, tenantId: string) {
    const shopId = this.requireActiveShopId(tenantId);
    this.validatePriceFields(createDto.price, createDto.original_price);
    await this.validateCategoryMetadata(createDto.car_brand, createDto.model_brand);

    // Declared outside transaction; cleared inside to handle potential retries
    let failedImages: { filename: string; error: string }[] = [];
    let totalImages = 0;

    const item = await this.prisma.$transaction(async (tx) => {
      // Clear on each attempt to prevent duplicates if transaction retries
      failedImages = [];
      totalImages = 0;
      const initialStatus = (createDto.status as ItemStatus | undefined) ?? 'con_hang';

      const item = await tx.item.create({
        data: {
          name: createDto.name,
          description: createDto.description,
          scale: createDto.scale || '1:64',
          brand: createDto.brand,
          car_brand: createDto.car_brand || null,
          model_brand: createDto.model_brand || null,
          condition: (createDto.condition as 'new' | 'old' | undefined) || null,
          price: createDto.price !== undefined && createDto.price !== null ? createDto.price : null,
          original_price: createDto.original_price !== undefined && createDto.original_price !== null ? createDto.original_price : null,
          status: initialStatus,
          quantity: resolveQuantityForStatus(initialStatus, createDto.quantity),
          attributes: toItemAttributesJson(createDto.attributes ?? {}),
          is_public: createDto.is_public || false,
          shop_id: shopId,
        },
      });

      // Handle Draft if provided
      if (createDto.draft_id) {
        const draft = await tx.aiItemDraft.findUnique({ where: { id: createDto.draft_id } });
        if (draft && draft.images_json) {
          const imageUrls = JSON.parse(draft.images_json) as string[];
          totalImages = imageUrls.length;

          let displayOrder = 0;
          for (const url of imageUrls) {
            const filename = url.split('/').pop();
            if (filename) {
              try {
                const newFilename = `item_${item.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
                const newPath = await this.storage.moveFile(`drafts/${filename}`, newFilename, 'images');

                await tx.itemImage.create({
                  data: {
                    item_id: item.id,
                    file_path: newPath,
                    is_cover: displayOrder === 0,
                    display_order: displayOrder,
                  },
                });
                displayOrder++;
              } catch (e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                failedImages.push({ filename, error: errorMessage });
                this.logger.error(
                  `Failed to process draft image "${filename}" for item ${item.id}`,
                  e instanceof Error ? e.stack : undefined,
                  `ItemsService.create | draftId=${createDto.draft_id}`,
                );
              }
            }
          }

          // Update draft status based on image processing results
          const draftStatus = failedImages.length === 0
            ? 'CONFIRMED'
            : failedImages.length < totalImages
              ? 'PARTIAL'
              : 'FAILED';

          await tx.aiItemDraft.update({
            where: { id: draft.id },
            data: { status: draftStatus },
          });
        }
      }

      return item;
    });

    // If some images failed, mark item with notes for admin review
    if (failedImages.length > 0) {
      const MAX_NOTES_LENGTH = 500;
      let notes = `[INCOMPLETE] Failed to process ${failedImages.length}/${totalImages} draft image(s): ` +
        failedImages.map((f) => f.filename).join(', ');

      if (notes.length > MAX_NOTES_LENGTH) {
        notes = notes.substring(0, MAX_NOTES_LENGTH - 3) + '...';
      }

      await this.prisma.item.update({
        where: { id: item.id },
        data: { notes },
      });

      this.logger.error(
        `Item ${item.id} created with ${failedImages.length}/${totalImages} failed image(s) ` +
        `from draft ${createDto.draft_id}. Details: ${failedImages.map((f) => `${f.filename}: ${f.error}`).join('; ')}`,
      );
    }

    // Sync with vector store
    this.syncVectorStore(item);

    return {
      item,
      ...(failedImages.length > 0 && {
        warning: {
          code: ErrorCode.DRAFT_IMAGE_PROCESSING_FAILED,
          message: `Failed to process ${failedImages.length}/${totalImages} image(s)`,
          failedImages: failedImages.map((f) => f.filename),
        },
      }),
    };
  }

  async update(id: string, updateDto: UpdateItemDto, tenantId: string) {
    const shopId = this.requireActiveShopId(tenantId);
    const existingItem = await this.prisma.item.findFirst({
      where: {
        id,
        deleted_at: null,
        shop_id: shopId,
      },
    });

    if (!existingItem) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
    }

    if (updateDto.status !== undefined) {
      this.validateStatusTransition(existingItem.status, updateDto.status);
    }

    const nextPrice = updateDto.price !== undefined
      ? updateDto.price
      : toNumber(existingItem.price);
    const nextOriginalPrice = updateDto.original_price !== undefined
      ? updateDto.original_price
      : toNumber(existingItem.original_price);
    const nextStatus = updateDto.status ?? existingItem.status;
    this.validatePriceFields(nextPrice ?? undefined, nextOriginalPrice ?? undefined);

    if (updateDto.car_brand !== undefined || updateDto.model_brand !== undefined) {
      await this.validateCategoryMetadata(updateDto.car_brand, updateDto.model_brand);
    }

    const updateData: Prisma.ItemUpdateInput = {};
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.description !== undefined) updateData.description = updateDto.description;
    if (updateDto.scale !== undefined) updateData.scale = updateDto.scale;
    if (updateDto.brand !== undefined) updateData.brand = updateDto.brand;
    if (updateDto.car_brand !== undefined) updateData.car_brand = updateDto.car_brand;
    if (updateDto.model_brand !== undefined) updateData.model_brand = updateDto.model_brand;
    if (updateDto.condition !== undefined) updateData.condition = updateDto.condition;
    if (updateDto.price !== undefined) updateData.price = updateDto.price ?? null;
    if (updateDto.original_price !== undefined) updateData.original_price = updateDto.original_price ?? null;
    if (updateDto.status !== undefined) updateData.status = updateDto.status;
    if (updateDto.quantity !== undefined) {
      updateData.quantity = resolveQuantityForStatus(nextStatus, updateDto.quantity);
    } else if (updateDto.status === 'da_ban' && existingItem.status !== 'da_ban') {
      updateData.quantity = 0;
    }
    if (updateDto.attributes !== undefined) {
      updateData.attributes = toItemAttributesJson(updateDto.attributes);
    }
    if (updateDto.is_public !== undefined) updateData.is_public = updateDto.is_public;
    if (updateDto.fb_post_content !== undefined) updateData.fb_post_content = updateDto.fb_post_content;

    const item = await this.prisma.item.update({
      where: { id },
      data: updateData,
    });

    // Sync with vector store
    this.syncVectorStore(item);

    return { item };
  }

  async remove(id: string, tenantId: string) {
    const shopId = this.requireActiveShopId(tenantId);
    const existingItem = await this.prisma.item.findFirst({
      where: {
        id,
        deleted_at: null,
        shop_id: shopId,
      },
    });

    if (!existingItem) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
    }

    await this.prisma.item.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    // Remove from vector store
    await this.vectorStore.deleteItem(id);

    return {};
  }

  async exportCsv(tenantId: string): Promise<string> {
    const shopId = this.requireActiveShopId(tenantId);
    const items = await this.prisma.item.findMany({
      where: {
        deleted_at: null,
        shop_id: shopId,
      },
      orderBy: { created_at: 'desc' },
    });

    const headers = [
      'id',
      'name',
      'description',
      'status',
      'is_public',
      'condition',
      'scale',
      'brand',
      'car_brand',
      'model_brand',
      'price',
      'original_price',
      'created_at',
      'updated_at',
    ];

    const escapeCsvField = (value: CsvFieldValue): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = items.map((item) => {
      const itemRecord = item as Record<string, CsvFieldValue>;
      return headers.map((header) => {
        let value = itemRecord[header];
        // Handle Decimal type from Prisma
        if (value !== null && typeof (value as { toNumber?: () => number })?.toNumber === 'function') {
          value = (value as { toNumber: () => number }).toNumber();
        }
        // Format dates
        if (value instanceof Date) {
          value = value.toISOString();
        }
        return escapeCsvField(value);
      }).join(',');
    });

    // Add UTF-8 BOM for Excel Vietnamese compatibility
    return '\uFEFF' + [headers.join(','), ...rows].join('\n');
  }

  async processVectorSyncQueue(limit: number = 20) {
    const tasks = await this.prisma.vectorSyncTask.findMany({
      where: { scheduled_at: { lte: new Date() } },
      orderBy: { scheduled_at: 'asc' },
      take: limit,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            description: true,
            brand: true,
            car_brand: true,
            scale: true,
            condition: true,
            is_public: true,
            deleted_at: true,
          },
        },
      },
    });

    for (const task of tasks) {
      try {
        if (!task.item) {
          this.logger.warn(
            `Vector sync task ${task.item_id} has no backing item. Cleaning up.`,
          );
          await this.clearVectorSyncPending(task.item_id);
          continue;
        }

        await this.syncVectorStore(task.item as VectorSyncItem);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `Vector queue failed for item ${task.item_id}: ${err.message}`,
          err.stack,
        );
        await this.markVectorSyncPending(task.item_id, err.message);
      }
    }

    return { processed: tasks.length };
  }

  private async markVectorSyncPending(itemId: string, reason: string) {
    try {
      const nextRun = new Date(Date.now() + this.vectorRetryDelayMs);
      await this.prisma.vectorSyncTask.upsert({
        where: { item_id: itemId },
        create: {
          item_id: itemId,
          attempt_count: 1,
          last_error: reason,
          scheduled_at: nextRun,
        },
        update: {
          attempt_count: { increment: 1 },
          last_error: reason,
          scheduled_at: nextRun,
        },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Failed to enqueue vector sync retry for item ${itemId}: ${err.message}`,
        err.stack,
      );
    }
  }

  private async clearVectorSyncPending(itemId: string) {
    await this.prisma.vectorSyncTask.deleteMany({ where: { item_id: itemId } });
  }

  private getImageUrl(filePath: string): string {
    // Use storage service to get consistent URL format
    return this.storage.getFileUrl(filePath);
  }

  async addFacebookPost(itemId: string, dto: { post_url: string; content?: string }, tenantId: string) {
    const shopId = this.requireActiveShopId(tenantId);
    const item = await this.prisma.item.findFirst({
      where: {
        id: itemId,
        deleted_at: null,
        shop_id: shopId,
      },
      include: { _count: { select: { facebook_posts: true } } },
    });
    if (!item) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
    }

    if (item._count.facebook_posts >= 50) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'Đã đạt giới hạn 50 bài FB cho sản phẩm này');
    }

    const post = await this.prisma.facebookPost.create({
      data: {
        item_id: itemId,
        post_url: dto.post_url,
        // Snapshot the best available caption on post creation so history keeps the
        // text that was actually used even if item.fb_post_content changes later.
        content: dto.content ?? item.fb_post_content ?? null,
      },
    });

    return { post };
  }

  async removeFacebookPost(itemId: string, postId: string, tenantId: string) {
    const shopId = this.requireActiveShopId(tenantId);
    const post = await this.prisma.facebookPost.findFirst({
      where: {
        id: postId,
        item_id: itemId,
        item: { shop_id: shopId },
      },
      include: { item: true },
    });
    if (!post) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Facebook post not found');
    }

    await this.prisma.facebookPost.delete({
      where: { id: postId },
    });

    return {};
  }

  /**
   * Publish a new post to Facebook for the given item.
   *
   * @param itemId - ID of the item to publish
   * @param dto    - Optional override for caption; falls back to item.fb_post_content
   *
   * NOTE (architecture): This method will be extracted to a dedicated
   * FacebookPostsService once the feature stabilises — see TODO in SRP tracking.
   * TODO: Extract to FacebookPostsService (see code-review finding #7)
   *
   * NOTE (race condition): There is a theoretical TOCTOU window between the
   * initial count check and the DB write. The transactional re-check below
   * significantly reduces the risk, but a 100% atomic fix would require
   * SELECT FOR UPDATE (raw SQL). Given the 5 req/min throttle per user this
   * risk is accepted as low-impact.
   */
  async publishFacebookPost(
    itemId: string,
    dto: PublishFacebookPostDto | undefined,
    tenantId: string,
  ) {
    const shopId = this.requireActiveShopId(tenantId);
    // Use isConfigured() from FacebookConfigService rather than null-checking
    // the injected service — the service is always present because FacebookModule
    // is always imported. This is a server misconfiguration, not a bad token.
    if (!this.fbConfig.isConfigured()) {
      throw new AppException(
        ErrorCode.INTERNAL_SERVER_ERROR,
        'Facebook integration chưa được cấu hình. Set FACEBOOK_PAGE_ID và FACEBOOK_PAGE_ACCESS_TOKEN.',
      );
    }

    const item = await this.prisma.item.findFirst({
      where: {
        id: itemId,
        deleted_at: null,
        shop_id: shopId,
      },
      include: { _count: { select: { facebook_posts: true } } },
    });

    if (!item) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
    }

    if (item._count.facebook_posts >= 50) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'Đã đạt giới hạn 50 bài FB cho sản phẩm này');
    }

    // Resolve caption: explicit override ?? item's saved content.
    // Using ?? (nullish coalescing) so an explicit empty string from client
    // propagates correctly and triggers the empty-content guard below.
    const caption = (dto?.content ?? item.fb_post_content ?? '').trim();
    if (!caption) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'Không có nội dung để đăng. Tạo nội dung FB trước khi publish.',
      );
    }

    // Call Facebook Graph API — this side effect cannot be rolled back if the
    // subsequent DB write fails. See the warn log below for recovery details.
    const result = await this.facebookGraph.publishPost(caption);

    // Wrap the DB write in a transaction with a re-check of the post count to
    // reduce the TOCTOU race window (two concurrent requests both passing the
    // initial check at count=49 would both call the Graph API, creating 51 posts).
    // The re-check here prevents both from persisting a record beyond the limit.
    let post: Awaited<ReturnType<typeof this.prisma.facebookPost.create>>;
    try {
      post = await this.prisma.$transaction(async (tx) => {
        const freshItem = await tx.item.findFirst({
          where: { id: itemId, deleted_at: null, shop_id: shopId },
          include: { _count: { select: { facebook_posts: true } } },
        });
        if (!freshItem || freshItem._count.facebook_posts >= 50) {
          throw new AppException(
            ErrorCode.VALIDATION_ERROR,
            'Đã đạt giới hạn 50 bài FB cho sản phẩm này',
          );
        }
        return tx.facebookPost.create({
          data: {
            item_id: itemId,
            post_url: result.postUrl,
            content: caption,
          },
        });
      });
    } catch (dbError) {
      if (dbError instanceof AppException) throw dbError;
      this.logger.warn(
        `Facebook post published but DB record creation failed for item ${itemId}. ` +
          `Post URL: ${result.postUrl}. Error: ${(dbError as Error).message}`,
      );
      throw new AppException(
        ErrorCode.FACEBOOK_PUBLISH_ERROR,
        `Bài đã được đăng lên Facebook (${result.postUrl}) nhưng lưu vào hệ thống thất bại. Vui lòng thêm link thủ công.`,
      );
    }

    this.logger.log(
      `Published Facebook post for item ${itemId}: ${result.postUrl}`,
    );

    return { post };
  }

  private validateStatusTransition(current: ItemStatus, next: ItemStatus) {
    const allowedNext = ALLOWED_STATUS_TRANSITIONS[current] || [];
    if (!allowedNext.includes(next)) {
      throw new AppException(
        ErrorCode.ITEM_STATUS_TRANSITION_INVALID,
        `Invalid item status transition from "${current}" to "${next}"`,
        [{ from: current, to: next }],
      );
    }
  }

  private async validateCategoryMetadata(
    carBrand?: string | null,
    modelBrand?: string | null,
  ) {
    const checks: Array<{ type: 'car_brand' | 'model_brand'; value?: string | null }> = [
      { type: 'car_brand', value: carBrand },
      { type: 'model_brand', value: modelBrand },
    ];

    for (const check of checks) {
      if (!check.value) continue;

      const category = await this.prisma.category.findFirst({
        where: {
          type: check.type,
          name: check.value,
          is_active: true,
        },
      });

      if (!category) {
        throw new AppException(
          ErrorCode.ITEM_CATEGORY_INVALID,
          `Invalid ${check.type} value "${check.value}". Category must exist and be active.`,
          [{ type: check.type, value: check.value }],
        );
      }
    }
  }

  private validatePriceFields(price?: number | null, originalPrice?: number | null) {
    if (price != null && price < 0) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'price must be greater than or equal to 0');
    }

    if (originalPrice != null && originalPrice < 0) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'original_price must be greater than or equal to 0');
    }

    if (price != null && originalPrice != null && originalPrice < price) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'original_price must be greater than or equal to price',
      );
    }
  }
}


