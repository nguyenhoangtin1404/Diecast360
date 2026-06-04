import { Injectable } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { QueryItemsDto } from './dto/query-items.dto';
import { PublishFacebookPostDto } from './dto/publish-facebook-post.dto';
import { ErrorCode } from '../common/exceptions/http-exception.filter';
import { ItemsCrudService } from './services/items-crud.service';
import { ItemsSearchService } from './services/items-search.service';
import { ItemsExportService } from './services/items-export.service';
import { ItemsFacebookService } from './services/items-facebook.service';
import { ItemsPreorderService } from './services/items-preorder.service';
import type { VectorSyncItem } from '../common/types/item.types';

@Injectable()
export class ItemsService {
  constructor(
    private crudService: ItemsCrudService,
    private searchService: ItemsSearchService,
    private exportService: ItemsExportService,
    private facebookService: ItemsFacebookService,
    private preorderService: ItemsPreorderService,
  ) {}

  async syncVectorStore(item: VectorSyncItem) {
    return this.searchService.syncVectorStore(item);
  }

  async search(query: string, tenantId: string, limit: number = 20) {
    return this.searchService.search(query, tenantId, limit);
  }

  async findAll(queryDto: QueryItemsDto, tenantId: string) {
    return this.crudService.findAll(queryDto, tenantId);
  }

  async findOne(id: string, tenantId: string) {
    return this.crudService.findOne(id, tenantId);
  }

  async create(createDto: CreateItemDto, tenantId: string) {
    const result = await this.crudService.create(createDto, tenantId);
    // Sync with vector store (fire-and-forget)
    this.searchService.syncVectorStore(result.item);

    const { failedImages, totalImages, item } = result;
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
    const result = await this.crudService.update(id, updateDto, tenantId);
    // Sync with vector store (fire-and-forget)
    this.searchService.syncVectorStore(result.item);
    return result;
  }

  async remove(id: string, tenantId: string) {
    const result = await this.crudService.remove(id, tenantId);
    // Remove from vector store
    await this.searchService.deleteFromVectorStore(id);
    return result;
  }

  async exportCsv(tenantId: string): Promise<string> {
    return this.exportService.exportCsv(tenantId);
  }

  async processVectorSyncQueue(limit: number = 20) {
    return this.searchService.processVectorSyncQueue(limit);
  }

  async addFacebookPost(itemId: string, dto: { post_url: string; content?: string }, tenantId: string) {
    return this.facebookService.addFacebookPost(itemId, dto, tenantId);
  }

  async removeFacebookPost(itemId: string, postId: string, tenantId: string) {
    return this.facebookService.removeFacebookPost(itemId, postId, tenantId);
  }

  async publishFacebookPost(
    itemId: string,
    dto: PublishFacebookPostDto | undefined,
    tenantId: string,
  ) {
    return this.facebookService.publishFacebookPost(itemId, dto, tenantId);
  }

  async closePreorder(id: string, tenantId: string) {
    return this.preorderService.closePreorder(id, tenantId);
  }

  async reopenPreorder(id: string, tenantId: string) {
    return this.preorderService.reopenPreorder(id, tenantId);
  }
}
