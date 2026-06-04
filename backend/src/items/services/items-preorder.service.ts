import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException, ErrorCode } from '../../common/exceptions/http-exception.filter';
import { requireActiveShopId } from '../../common/utils/require-active-shop';

@Injectable()
export class ItemsPreorderService {
  constructor(private prisma: PrismaService) {}

  async closePreorder(id: string, tenantId: string) {
    const shopId = requireActiveShopId(tenantId);
    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const item = await tx.item.findFirst({
        where: { id, deleted_at: null, shop_id: shopId },
      });
      if (!item) {
        throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
      }
      if (item.status !== 'preorder') {
        throw new AppException(ErrorCode.VALIDATION_ERROR, 'Item is not a preorder item');
      }
      if (item.preorder_closes_at && item.preorder_closes_at <= now) {
        throw new AppException(ErrorCode.VALIDATION_ERROR, 'Preorder is already closed');
      }
      return tx.item.update({ where: { id, shop_id: shopId, deleted_at: null }, data: { preorder_closes_at: now } });
    });
    return { item: updated };
  }

  async reopenPreorder(id: string, tenantId: string) {
    const shopId = requireActiveShopId(tenantId);
    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const item = await tx.item.findFirst({
        where: { id, deleted_at: null, shop_id: shopId },
      });
      if (!item) {
        throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
      }
      if (item.status !== 'preorder') {
        throw new AppException(ErrorCode.VALIDATION_ERROR, 'Item is not a preorder item');
      }
      if (!item.preorder_closes_at || item.preorder_closes_at > now) {
        throw new AppException(ErrorCode.VALIDATION_ERROR, 'Preorder is not closed yet');
      }
      return tx.item.update({
        where: { id, shop_id: shopId, deleted_at: null },
        data: { preorder_closes_at: null, preorder_opens_at: now },
      });
    });
    return { item: updated };
  }
}
