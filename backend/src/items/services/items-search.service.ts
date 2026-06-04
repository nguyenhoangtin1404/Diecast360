import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { VectorStoreService } from '../../ai/vector-store.service';
import { EmbeddingService, EmbeddingUnavailableError } from '../../ai/embedding.service';
import type { VectorSyncItem, ItemWithCoverImage } from '../../common/types/item.types';
import { toNumber } from '../../common/utils/decimal.utils';
import { ItemsCrudService } from './items-crud.service';

@Injectable()
export class ItemsSearchService {
  private readonly logger = new Logger(ItemsSearchService.name);
  private readonly vectorRetryDelayMs = 5 * 60 * 1000;

  constructor(
    private prisma: PrismaService,
    private vectorStore: VectorStoreService,
    private embeddingService: EmbeddingService,
    private crudService: ItemsCrudService,
  ) {}

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
    const shopId = this.crudService.requireActiveShopId(tenantId);
    // Try vector/semantic search first, fallback to text search
    try {
      const embedding = await this.embeddingService.getEmbedding(query);
      if (!embedding.length) {
        return this.crudService.findAll({ q: query, page: 1, page_size: limit }, shopId);
      }

      const ids = await this.vectorStore.search(embedding, limit);

      if (ids.length === 0) {
        // No vector results - fallback to text search
        return this.crudService.findAll({ q: query, page: 1, page_size: limit }, shopId);
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

      const itemsWithCover = await Promise.all(
        sortedItems.map(async (item) => {
          const itemWithImages = item as ItemWithCoverImage;
          return {
            ...itemWithImages,
            price: toNumber(itemWithImages.price),
            original_price: toNumber(itemWithImages.original_price),
            cover_image_url: itemWithImages.item_images[0]
              ? await this.crudService.getImageUrl(itemWithImages.item_images[0].file_path)
              : null,
            item_images: undefined,
          };
        }),
      );

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
      return this.crudService.findAll({ q: query, page: 1, page_size: limit }, shopId);
    }
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

  async deleteFromVectorStore(itemId: string) {
    await this.vectorStore.deleteItem(itemId);
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
}
