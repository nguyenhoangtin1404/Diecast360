import { Injectable } from '@nestjs/common';
import { PreOrderStatus, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException, ErrorCode } from '../../common/exceptions/http-exception.filter';
import { toNumber } from '../../common/utils/decimal.utils';
import { assertValidPreOrderStatusTransition } from '../domain/preorder-transition';
import { PreOrderDomainException } from '../domain/preorder-domain.exception';
import { MembersService } from '../../members/members.service';
import { parseShopLoyaltyJson } from '../../shops/shop-loyalty-json.util';
import { requireActiveShopId } from '../../common/utils/require-active-shop';

@Injectable()
export class PreordersStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membersService: MembersService,
  ) {}

  async transitionStatus(
    id: string,
    nextStatus: PreOrderStatus,
    tenantId: string,
    actorUserId: string | null,
  ) {
    const shopId = requireActiveShopId(tenantId);

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.preOrder.findFirst({
        where: { id, shop_id: shopId },
      });
      if (!current) {
        throw new AppException(ErrorCode.NOT_FOUND, 'Pre-order not found');
      }

      try {
        assertValidPreOrderStatusTransition(current.status as PreOrderStatus, nextStatus);
      } catch (error) {
        if (!(error instanceof PreOrderDomainException)) {
          throw error;
        }
        throw new AppException(
          ErrorCode.VALIDATION_ERROR,
          `Invalid pre-order status transition from "${current.status}" to "${nextStatus}"`,
        );
      }

      const now = new Date();
      const data: Prisma.PreOrderUpdateManyMutationInput = {
        status: nextStatus,
        cancelled_at: nextStatus === PreOrderStatus.CANCELLED ? now : null,
      };
      if (nextStatus === PreOrderStatus.PAID) {
        data.completed_at = now;
      }
      if (nextStatus === PreOrderStatus.REFUNDED) {
        data.completed_at = null;
      }

      const updated = await tx.preOrder.updateMany({
        where: {
          id,
          shop_id: shopId,
          status: current.status,
        },
        data,
      });
      if (updated.count === 0) {
        throw new AppException(
          ErrorCode.VALIDATION_ERROR,
          'Pre-order status changed concurrently. Please refresh and retry.',
        );
      }

      if (nextStatus === PreOrderStatus.PAID) {
        if (!current.member_id) {
          throw new AppException(
            ErrorCode.VALIDATION_ERROR,
            'Cannot mark as paid without a member on this pre-order. Assign a member first.',
          );
        }
        const shop = await tx.shop.findFirst({
          where: { id: shopId },
          select: { loyalty_json: true },
        });
        const loyalty = parseShopLoyaltyJson(shop?.loyalty_json ?? {});
        const basisVnd =
          loyalty.preorder_points_basis === 'total_amount'
            ? (toNumber(current.total_amount) ?? 0)
            : (toNumber(current.paid_amount) ?? 0);
        await this.membersService.applyPreorderPaidPointsIfNeededInTx(tx, {
          shopId,
          preorderId: id,
          memberId: current.member_id,
          basisVnd,
          vndPerPoint: loyalty.vnd_per_point,
          actorUserId,
        });
      }

      if (nextStatus === PreOrderStatus.REFUNDED) {
        if (!current.member_id) {
          throw new AppException(
            ErrorCode.VALIDATION_ERROR,
            'Cannot refund without a member on this pre-order.',
          );
        }
        await this.membersService.applyPreorderRefundRedeemIfNeededInTx(tx, {
          shopId,
          preorderId: id,
          memberId: current.member_id,
          actorUserId,
        });
      }

      const preorder = await tx.preOrder.findFirst({
        where: { id, shop_id: shopId },
      });
      if (!preorder) {
        throw new AppException(ErrorCode.NOT_FOUND, 'Pre-order not found');
      }

      return { preorder };
    });
  }
}
