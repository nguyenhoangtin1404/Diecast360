import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException, ErrorCode } from '../../common/exceptions/http-exception.filter';
import { ItemsCrudService } from './items-crud.service';

@Injectable()
export class ItemsPreorderService {
  constructor(
    private prisma: PrismaService,
    private crudService: ItemsCrudService,
  ) {}

  async closePreorder(id: string, tenantId: string) {
    const shopId = this.crudService.requireActiveShopId(tenantId);
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
      return tx.item.update({ where: { id }, data: { preorder_closes_at: now } });
    });
    return { item: updated };
  }

  async reopenPreorder(id: string, tenantId: string) {
    const shopId = this.crudService.requireActiveShopId(tenantId);
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
        where: { id },
        data: { preorder_closes_at: null, preorder_opens_at: now },
      });
    });
    return { item: updated };
  }
}
