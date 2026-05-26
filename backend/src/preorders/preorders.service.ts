import { Inject, Injectable } from '@nestjs/common';
import { PlatformRole, PreOrderStatus, Prisma, ShopRole } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { toNumber } from '../common/utils/decimal.utils';
import { IStorageService } from '../storage/storage.interface';
import { assertValidPreOrderStatusTransition } from './domain/preorder-transition';
import { PreOrderDomainException } from './domain/preorder-domain.exception';
import { CreatePreorderDto } from './dto/create-preorder.dto';
import { UpdatePreorderDto } from './dto/update-preorder.dto';
import { QueryPreordersDto } from './dto/query-preorders.dto';
import { totalPagesFromCount } from '../common/utils/pagination.utils';
import { MembersService } from '../members/members.service';
import { parseShopLoyaltyJson } from '../shops/shop-loyalty-json.util';

@Injectable()
export class PreordersService {
  private static readonly PUBLIC_STATUSES: ReadonlyArray<PreOrderStatus> = [
    PreOrderStatus.PENDING_CONFIRMATION,
    PreOrderStatus.WAITING_FOR_GOODS,
  ];

  constructor(
    private readonly prisma: PrismaService,
    @Inject('IStorageService') private readonly storage: IStorageService,
    private readonly membersService: MembersService,
  ) {}

  private requireActiveShopId(tenantId: string | undefined | null): string {
    if (typeof tenantId !== 'string' || tenantId.trim().length === 0) {
      throw new AppException(
        ErrorCode.AUTH_FORBIDDEN,
        'Active shop context is required for this operation.',
      );
    }
    return tenantId.trim();
  }

  private async assertItemInShop(itemId: string, shopId: string): Promise<void> {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, shop_id: shopId, deleted_at: null },
      select: { id: true },
    });
    if (!item) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Item not found in active shop');
    }
  }

  private async assertMemberInShop(memberId: string, shopId: string): Promise<void> {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, shop_id: shopId },
      select: { id: true },
    });
    if (!member) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'Member not found in this shop');
    }
  }

  private async assertActiveShop(shopId: string): Promise<void> {
    const shop = await this.prisma.shop.findFirst({
      where: { id: shopId, is_active: true },
      select: { id: true },
    });
    if (!shop) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Shop not found or inactive');
    }
  }

  /** Who may appear as {@link PreOrder.user_id} when different from the actor. */
  private async assertPreorderAssigneeAllowed(
    shopId: string,
    assigneeUserId: string,
    actorUserId: string | null,
    platformRole: PlatformRole | null,
  ): Promise<void> {
    if (!actorUserId) {
      throw new AppException(ErrorCode.AUTH_FORBIDDEN, 'Authenticated user is required.');
    }
    if (assigneeUserId === actorUserId) {
      return;
    }
    if (platformRole === PlatformRole.platform_super) {
      return;
    }
    const assigneeMembership = await this.prisma.userShopRole.findUnique({
      where: { user_id_shop_id: { user_id: assigneeUserId, shop_id: shopId } },
      select: { user_id: true },
    });
    if (!assigneeMembership) {
      throw new AppException(
        ErrorCode.AUTH_FORBIDDEN,
        'You may only assign pre-orders to yourself or to users who belong to this shop.',
      );
    }
  }

  /** Who may PATCH a preorder row (owner, shop admin for this shop, or platform super). */
  private async assertActorCanMutatePreorder(
    shopId: string,
    preorderOwnerUserId: string | null,
    actorUserId: string | null,
    platformRole: PlatformRole | null,
  ): Promise<void> {
    if (!actorUserId) {
      throw new AppException(ErrorCode.AUTH_FORBIDDEN, 'Authenticated user is required.');
    }
    if (platformRole === PlatformRole.platform_super) {
      return;
    }
    if (preorderOwnerUserId != null && preorderOwnerUserId === actorUserId) {
      return;
    }
    const actorMembership = await this.prisma.userShopRole.findUnique({
      where: { user_id_shop_id: { user_id: actorUserId, shop_id: shopId } },
      select: { role: true },
    });
    if (
      actorMembership &&
      (actorMembership.role === ShopRole.shop_admin || actorMembership.role === ShopRole.super_admin)
    ) {
      return;
    }
    throw new AppException(
      ErrorCode.AUTH_FORBIDDEN,
      'You can only update your own pre-order unless you are a shop admin.',
    );
  }

  private validateFinancials(input: {
    unitPrice: number | null;
    quantity: number;
    depositAmount: number;
    paidAmount: number;
  }): void {
    const { unitPrice, quantity, depositAmount, paidAmount } = input;
    const totalAmount =
      unitPrice != null && unitPrice > 0 ? Number((unitPrice * quantity).toFixed(2)) : null;

    if (depositAmount < 0 || paidAmount < 0) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'deposit_amount and paid_amount must be >= 0');
    }

    if (paidAmount < depositAmount) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'paid_amount must be >= deposit_amount');
    }

    if (totalAmount != null) {
      if (depositAmount > totalAmount) {
        throw new AppException(ErrorCode.VALIDATION_ERROR, 'deposit_amount must be <= total_amount');
      }
      if (paidAmount > totalAmount) {
        throw new AppException(ErrorCode.VALIDATION_ERROR, 'paid_amount must be <= total_amount');
      }
    }
  }

  private async toCard(data: {
    id: string;
    status: PreOrderStatus;
    quantity: number;
    unit_price: Prisma.Decimal | number | null;
    total_amount: Prisma.Decimal | number | null;
    deposit_amount: Prisma.Decimal | number;
    expected_arrival_at: Date | null;
    expected_delivery_at: Date | null;
    item: {
      name: string;
      scale: string;
      brand: string | null;
      car_brand: string | null;
      model_brand: string | null;
      preorder_closes_at: Date | null;
      item_images: Array<{ file_path: string }>;
    };
  }) {
    return {
      id: data.id,
      status: data.status,
      quantity: data.quantity,
      display_price: toNumber(data.total_amount) ?? toNumber(data.unit_price) ?? 0,
      deposit_amount: toNumber(data.deposit_amount) ?? 0,
      countdown_target: data.expected_arrival_at ?? data.expected_delivery_at,
      preorder_closes_at: data.item.preorder_closes_at?.toISOString() ?? null,
      title: data.item.name,
      short_specs: [data.item.scale, data.item.brand, data.item.car_brand, data.item.model_brand]
        .filter(Boolean)
        .join(' | '),
      cover_image_url: data.item.item_images[0]
        ? await this.storage.getFileUrl(data.item.item_images[0].file_path)
        : null,
    };
  }

  async create(
    dto: CreatePreorderDto,
    tenantId: string,
    actor: { userId: string | null; platformRole: PlatformRole | null },
  ) {
    const shopId = this.requireActiveShopId(tenantId);
    if (dto.user_id) {
      await this.assertPreorderAssigneeAllowed(shopId, dto.user_id, actor.userId, actor.platformRole);
    }
    await this.assertItemInShop(dto.item_id, shopId);
    await this.assertMemberInShop(dto.member_id, shopId);
    const normalizedUnitPrice =
      dto.unit_price != null && dto.unit_price > 0 ? dto.unit_price : null;
    this.validateFinancials({
      unitPrice: normalizedUnitPrice,
      quantity: dto.quantity,
      depositAmount: dto.deposit_amount ?? 0,
      paidAmount: dto.paid_amount ?? 0,
    });
    const totalAmount =
      normalizedUnitPrice != null
        ? Number((normalizedUnitPrice * dto.quantity).toFixed(2))
        : null;

    const preorder = await this.prisma.preOrder.create({
      data: {
        shop_id: shopId,
        item_id: dto.item_id,
        user_id: dto.user_id ?? actor.userId ?? null,
        member_id: dto.member_id,
        quantity: dto.quantity,
        unit_price: normalizedUnitPrice,
        total_amount: totalAmount,
        deposit_amount: dto.deposit_amount ?? 0,
        paid_amount: dto.paid_amount ?? 0,
        expected_arrival_at: dto.expected_arrival_at ? new Date(dto.expected_arrival_at) : null,
        expected_delivery_at: dto.expected_delivery_at ? new Date(dto.expected_delivery_at) : null,
        note: dto.note?.trim() ? dto.note.trim() : null,
        cover_image_url: dto.cover_image_url?.trim() ? dto.cover_image_url.trim() : null,
      },
    });

    return { preorder };
  }

  async update(
    id: string,
    dto: UpdatePreorderDto,
    tenantId: string,
    actor: { userId: string | null; platformRole: PlatformRole | null },
  ) {
    const shopId = this.requireActiveShopId(tenantId);
    const current = await this.prisma.preOrder.findFirst({
      where: { id, shop_id: shopId },
    });
    if (!current) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Pre-order not found');
    }
    await this.assertActorCanMutatePreorder(
      shopId,
      current.user_id,
      actor.userId,
      actor.platformRole,
    );
    if (dto.user_id !== undefined) {
      await this.assertPreorderAssigneeAllowed(shopId, dto.user_id, actor.userId, actor.platformRole);
    }
    if (dto.item_id) {
      await this.assertItemInShop(dto.item_id, shopId);
    }
    if (dto.member_id !== undefined) {
      if (
        current.status === PreOrderStatus.PAID ||
        current.status === PreOrderStatus.REFUNDED ||
        current.status === PreOrderStatus.CANCELLED
      ) {
        throw new AppException(
          ErrorCode.VALIDATION_ERROR,
          'Cannot change member on a pre-order that is already paid, refunded, or cancelled.',
        );
      }
      await this.assertMemberInShop(dto.member_id, shopId);
    }

    const isFinanciallyLocked =
      current.status === PreOrderStatus.PAID ||
      current.status === PreOrderStatus.REFUNDED ||
      current.status === PreOrderStatus.CANCELLED;
    if (isFinanciallyLocked) {
      const triesFinancialChange =
        dto.item_id !== undefined ||
        dto.quantity !== undefined ||
        dto.unit_price !== undefined ||
        dto.deposit_amount !== undefined ||
        dto.paid_amount !== undefined;
      if (triesFinancialChange) {
        throw new AppException(
          ErrorCode.VALIDATION_ERROR,
          'Cannot change item, quantity, or amounts on a pre-order that is paid, refunded, or cancelled.',
        );
      }
    }

    const quantity = dto.quantity ?? current.quantity;
    const mergedUnitPrice =
      dto.unit_price !== undefined ? dto.unit_price : toNumber(current.unit_price);
    const normalizedUnitPrice =
      mergedUnitPrice != null && mergedUnitPrice > 0 ? mergedUnitPrice : null;
    const depositAmount = dto.deposit_amount ?? toNumber(current.deposit_amount) ?? 0;
    const paidAmount = dto.paid_amount ?? toNumber(current.paid_amount) ?? 0;
    this.validateFinancials({
      unitPrice: normalizedUnitPrice,
      quantity,
      depositAmount,
      paidAmount,
    });
    const totalAmount =
      normalizedUnitPrice != null ? Number((normalizedUnitPrice * quantity).toFixed(2)) : null;
    const shouldRefreshPricing = dto.unit_price !== undefined || dto.quantity !== undefined;

    const hasExpectedArrival = Object.prototype.hasOwnProperty.call(dto, 'expected_arrival_at');
    const hasExpectedDelivery = Object.prototype.hasOwnProperty.call(dto, 'expected_delivery_at');

    const preorder = await this.prisma.preOrder.update({
      where: { id },
      data: {
        item_id: dto.item_id,
        user_id: dto.user_id,
        member_id: dto.member_id,
        quantity: dto.quantity,
        unit_price: dto.unit_price !== undefined ? normalizedUnitPrice : undefined,
        total_amount: shouldRefreshPricing ? totalAmount : undefined,
        deposit_amount: dto.deposit_amount,
        paid_amount: dto.paid_amount,
        expected_arrival_at: hasExpectedArrival
          ? dto.expected_arrival_at === null
            ? null
            : new Date(dto.expected_arrival_at)
          : undefined,
        expected_delivery_at: hasExpectedDelivery
          ? dto.expected_delivery_at === null
            ? null
            : new Date(dto.expected_delivery_at)
          : undefined,
        note: dto.note,
      },
    });

    return { preorder };
  }

  async transitionStatus(
    id: string,
    nextStatus: PreOrderStatus,
    tenantId: string,
    actorUserId: string | null,
  ) {
    const shopId = this.requireActiveShopId(tenantId);

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

  async findAdminList(query: QueryPreordersDto, tenantId: string) {
    const shopId = this.requireActiveShopId(tenantId);
    const page = query.page ?? 1;
    const pageSize = Math.min(query.page_size ?? 20, 100);
    const skip = (page - 1) * pageSize;
    const where: Prisma.PreOrderWhereInput = { shop_id: shopId };
    if (query.status) where.status = query.status;
    if (query.item_id) where.item_id = query.item_id;

    const [rows, total] = await Promise.all([
      this.prisma.preOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        include: {
          item: { select: { name: true, preorder_closes_at: true, created_at: true } },
          user: { select: { id: true, full_name: true, email: true } },
          member: { select: { id: true, full_name: true, phone: true } },
        },
      }),
      this.prisma.preOrder.count({ where }),
    ]);

    return {
      preorders: rows.map((row) => ({
        ...row,
        unit_price: toNumber(row.unit_price),
        total_amount: toNumber(row.total_amount),
        deposit_amount: toNumber(row.deposit_amount),
        paid_amount: toNumber(row.paid_amount),
        item: row.item
          ? {
              ...row.item,
              preorder_closes_at: row.item.preorder_closes_at?.toISOString() ?? null,
              created_at: row.item.created_at.toISOString(),
            }
          : row.item,
      })),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: totalPagesFromCount(total, pageSize),
      },
    };
  }

  async findPublicCards(shopId: string, query: QueryPreordersDto) {
    await this.assertActiveShop(shopId);
    const page = query.page ?? 1;
    const pageSize = Math.min(query.page_size ?? 20, 50);
    const skip = (page - 1) * pageSize;
    const where: Prisma.PreOrderWhereInput = {
      shop_id: shopId,
      status: { in: [...PreordersService.PUBLIC_STATUSES] },
      item: { is_public: true, deleted_at: null },
    };
    if (query.item_id) where.item_id = query.item_id;
    if (query.status) {
      if (!PreordersService.PUBLIC_STATUSES.includes(query.status)) {
        throw new AppException(
          ErrorCode.VALIDATION_ERROR,
          'Invalid public status filter. Only PENDING_CONFIRMATION and WAITING_FOR_GOODS are allowed.',
        );
      }
      where.status = query.status;
    }

    const rows = await this.prisma.preOrder.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ expected_arrival_at: 'asc' }, { created_at: 'desc' }],
      include: {
        item: {
          select: {
            name: true,
            scale: true,
            brand: true,
            car_brand: true,
            model_brand: true,
            preorder_closes_at: true,
            item_images: { where: { is_cover: true }, take: 1, select: { file_path: true } },
          },
        },
      },
    });

    return {
      cards: await Promise.all(rows.map((row) => this.toCard(row))),
      pagination: {
        page,
        page_size: pageSize,
      },
    };
  }

  async findMyOrders(userId: string, tenantId: string, query: QueryPreordersDto) {
    const shopId = this.requireActiveShopId(tenantId);
    const page = query.page ?? 1;
    const pageSize = Math.min(query.page_size ?? 20, 50);
    const skip = (page - 1) * pageSize;
    const where: Prisma.PreOrderWhereInput = { shop_id: shopId, user_id: userId };
    if (query.status) where.status = query.status;

    const [rows, total] = await Promise.all([
      this.prisma.preOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ created_at: 'desc' }],
        include: {
          item: {
            select: {
              name: true,
              scale: true,
              brand: true,
              car_brand: true,
              model_brand: true,
              preorder_closes_at: true,
              item_images: { where: { is_cover: true }, take: 1, select: { file_path: true } },
            },
          },
        },
      }),
      this.prisma.preOrder.count({ where }),
    ]);

    return {
      cards: await Promise.all(rows.map((row) => this.toCard(row))),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: totalPagesFromCount(total, pageSize),
      },
    };
  }

  async getAdminSummary(tenantId: string) {
    const shopId = this.requireActiveShopId(tenantId);
    const grouped = await this.prisma.preOrder.groupBy({
      by: ['status'],
      where: { shop_id: shopId },
      _count: { _all: true },
      _sum: { total_amount: true, paid_amount: true },
    });

    return {
      summary: grouped.map((row) => ({
        status: row.status,
        total_orders: row._count._all,
        total_amount: toNumber(row._sum.total_amount) ?? 0,
        total_paid: toNumber(row._sum.paid_amount) ?? 0,
      })),
    };
  }

  async getCampaignParticipants(itemId: string, tenantId: string, query: QueryPreordersDto = {}) {
    const shopId = this.requireActiveShopId(tenantId);
    const page = query.page ?? 1;
    const pageSize = Math.min(query.page_size ?? 20, 100);
    const skip = (page - 1) * pageSize;
    const where: Prisma.PreOrderWhereInput = { shop_id: shopId, item_id: itemId };
    if (query.status) where.status = query.status;
    const [rows, total] = await Promise.all([
      this.prisma.preOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ created_at: 'desc' }],
        include: {
          user: { select: { id: true, full_name: true, email: true } },
          member: { select: { id: true, full_name: true, phone: true } },
        },
      }),
      this.prisma.preOrder.count({ where }),
    ]);

    return {
      participants: rows.map((row) => ({
        preorder_id: row.id,
        status: row.status,
        quantity: row.quantity,
        deposit_amount: toNumber(row.deposit_amount) ?? 0,
        paid_amount: toNumber(row.paid_amount) ?? 0,
        member_id: row.member_id,
        user: row.user,
        member: row.member,
      })),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: totalPagesFromCount(total, pageSize),
      },
    };
  }

  async getCampaignItemSummary(itemId: string, tenantId: string) {
    const shopId = this.requireActiveShopId(tenantId);

    const activeStatuses = [
      PreOrderStatus.PENDING_CONFIRMATION,
      PreOrderStatus.WAITING_FOR_GOODS,
      PreOrderStatus.ARRIVED,
    ] as const;

    const [grouped, cancelableCount, withDepositCount] = await Promise.all([
      this.prisma.preOrder.groupBy({
        by: ['status'],
        where: { shop_id: shopId, item_id: itemId, status: { in: [...activeStatuses] } },
        _count: { _all: true },
      }),
      this.prisma.preOrder.count({
        where: {
          shop_id: shopId,
          item_id: itemId,
          status: { in: [PreOrderStatus.PENDING_CONFIRMATION, PreOrderStatus.WAITING_FOR_GOODS] },
          paid_amount: { equals: 0 },
        },
      }),
      this.prisma.preOrder.count({
        where: {
          shop_id: shopId,
          item_id: itemId,
          status: { in: [PreOrderStatus.PENDING_CONFIRMATION, PreOrderStatus.WAITING_FOR_GOODS] },
          paid_amount: { gt: 0 },
        },
      }),
    ]);

    const counts = { pending: 0, waiting: 0, arrived: 0 };
    for (const row of grouped) {
      if (row.status === PreOrderStatus.PENDING_CONFIRMATION) counts.pending = row._count._all;
      if (row.status === PreOrderStatus.WAITING_FOR_GOODS) counts.waiting = row._count._all;
      if (row.status === PreOrderStatus.ARRIVED) counts.arrived = row._count._all;
    }

    return {
      ...counts,
      total: counts.pending + counts.waiting + counts.arrived,
      cancelable: cancelableCount,
      with_deposit: withDepositCount,
    };
  }
}
