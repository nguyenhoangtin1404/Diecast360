import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';

/**
 * Resolves public catalog `shop_id` query (UUID or Shop.slug) to a canonical shop UUID.
 * Only active shops are served; unknown/inactive → NOT_FOUND.
 */
@Injectable()
export class PublicShopResolverService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * When the client omits `shop_id`, returns null (caller falls back to JWT `active_shop_id`).
   * When present, returns the shop UUID; explicit query overrides JWT for public reads.
   */
  async resolveCanonicalShopId(raw: string | undefined): Promise<string | null> {
    const trimmed = raw?.trim();
    if (!trimmed) {
      return null;
    }

    const shop = isUUID(trimmed)
      ? await this.prisma.shop.findFirst({
          where: { id: trimmed, is_active: true },
          select: { id: true },
        })
      : await this.prisma.shop.findFirst({
          where: { slug: trimmed, is_active: true },
          select: { id: true },
        });

    if (!shop) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Shop not found');
    }

    return shop.id;
  }
}
