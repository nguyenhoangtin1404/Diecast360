import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException, ErrorCode } from '../../common/exceptions/http-exception.filter';
import { PublishFacebookPostDto } from '../dto/publish-facebook-post.dto';
import { FacebookGraphService } from '../../integrations/facebook/facebook-graph.service';
import { FacebookConfigService } from '../../integrations/facebook/facebook-config.service';
import { ItemsCrudService } from './items-crud.service';

@Injectable()
export class ItemsFacebookService {
  private readonly logger = new Logger(ItemsFacebookService.name);

  constructor(
    private prisma: PrismaService,
    // FacebookModule is always imported in ItemsModule, so these services are
    // always available. @Optional() was removed — use fbConfig.isConfigured()
    // to detect whether the feature is enabled instead of null-checking the service.
    private facebookGraph: FacebookGraphService,
    private fbConfig: FacebookConfigService,
    private crudService: ItemsCrudService,
  ) {}

  async addFacebookPost(itemId: string, dto: { post_url: string; content?: string }, tenantId: string) {
    const shopId = this.crudService.requireActiveShopId(tenantId);
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
    const shopId = this.crudService.requireActiveShopId(tenantId);
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
    const shopId = this.crudService.requireActiveShopId(tenantId);
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
}
