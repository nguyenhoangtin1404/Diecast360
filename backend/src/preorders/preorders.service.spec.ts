import { Test, TestingModule } from '@nestjs/testing';
import { PlatformRole, PreOrderStatus, ShopRole } from '../generated/prisma/client';
import { AppException } from '../common/exceptions/http-exception.filter';
import { PrismaService } from '../common/prisma/prisma.service';
import { PreordersService } from './preorders.service';
import { MembersService } from '../members/members.service';

describe('PreordersService', () => {
  let service: PreordersService;
  const prisma = {
    shop: { findFirst: jest.fn() },
    item: { findFirst: jest.fn() },
    member: { findFirst: jest.fn() },
    userShopRole: { findUnique: jest.fn() },
    preOrder: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const storage = { getFileUrl: jest.fn(async (path: string) => `http://localhost/${path}`) };
  const membersService = {
    applyPreorderPaidPointsIfNeededInTx: jest.fn(),
    applyPreorderRefundRedeemIfNeededInTx: jest.fn(),
  };

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const memberId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreordersService,
        { provide: PrismaService, useValue: prisma },
        { provide: 'IStorageService', useValue: storage },
        { provide: MembersService, useValue: membersService },
      ],
    }).compile();

    service = module.get<PreordersService>(PreordersService);
    jest.clearAllMocks();
    prisma.member.findFirst.mockResolvedValue({ id: memberId });
    prisma.$transaction.mockImplementation(async (fn: (client: typeof prisma) => Promise<unknown>) =>
      fn(prisma as never),
    );
  });

  it('rejects invalid transition', async () => {
    prisma.preOrder.findFirst.mockResolvedValue({
      id: 'po-1',
      shop_id: tenantId,
      status: PreOrderStatus.PAID,
    });

    await expect(
      service.transitionStatus('po-1', PreOrderStatus.WAITING_FOR_GOODS, tenantId, 'u1'),
    ).rejects.toBeInstanceOf(AppException);
  });

  it('returns public cards with required MVP fields', async () => {
    prisma.shop.findFirst.mockResolvedValue({ id: tenantId });
    prisma.preOrder.findMany.mockResolvedValue([
      {
        id: 'po-1',
        status: PreOrderStatus.WAITING_FOR_GOODS,
        quantity: 2,
        unit_price: { toNumber: () => 100 },
        total_amount: { toNumber: () => 200 },
        deposit_amount: { toNumber: () => 50 },
        expected_arrival_at: new Date('2026-04-20T00:00:00.000Z'),
        expected_delivery_at: null,
        item: {
          name: 'Mini GT R34',
          scale: '1:64',
          brand: 'Mini GT',
          car_brand: 'Nissan',
          model_brand: 'Skyline',
          preorder_closes_at: null,
          preorder_opens_at: new Date('2026-01-01T00:00:00.000Z'),
          created_at: new Date('2026-01-01T00:00:00.000Z'),
          item_images: [{ file_path: 'images/cover.jpg' }],
        },
      },
    ]);

    const result = await service.findPublicCards(tenantId, { page: 1, page_size: 10 });
    expect(result.cards[0]).toEqual(
      expect.objectContaining({
        status: PreOrderStatus.WAITING_FOR_GOODS,
        countdown_target: expect.any(Date),
        preorder_closes_at: null,
        preorder_opens_at: '2026-01-01T00:00:00.000Z',
        display_price: 200,
        short_specs: expect.stringContaining('1:64'),
        cover_image_url: 'http://localhost/images/cover.jpg',
      }),
    );
    expect(prisma.preOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          shop_id: tenantId,
          item: { is_public: true, deleted_at: null },
        }),
        take: 10,
      }),
    );
  });

  it('rejects public cards when shop is inactive or missing', async () => {
    prisma.shop.findFirst.mockResolvedValue(null);
    await expect(service.findPublicCards(tenantId, {})).rejects.toBeInstanceOf(AppException);
    expect(prisma.preOrder.findMany).not.toHaveBeenCalled();
  });

  it('rejects public cards when filtering with non-public status', async () => {
    prisma.shop.findFirst.mockResolvedValue({ id: tenantId });
    await expect(
      service.findPublicCards(tenantId, { status: PreOrderStatus.PAID }),
    ).rejects.toBeInstanceOf(AppException);
    expect(prisma.preOrder.findMany).not.toHaveBeenCalled();
  });

  it('rejects create when financial totals are inconsistent', async () => {
    prisma.item.findFirst.mockResolvedValue({ id: 'item-1' });
    await expect(
      service.create(
        {
          item_id: 'f9f4f357-4957-4bdf-a8ea-1434d9f801f7',
          member_id: memberId,
          quantity: 1,
          unit_price: 100,
          deposit_amount: 120,
        },
        tenantId,
        { userId: 'user-1', platformRole: null },
      ),
    ).rejects.toBeInstanceOf(AppException);
  });

  it('allows create with deposit and paid when unit_price is omitted (no total cap)', async () => {
    prisma.item.findFirst.mockResolvedValue({ id: 'item-1' });
    prisma.preOrder.create.mockResolvedValue({ id: 'new-po' });

    await service.create(
      {
        item_id: 'f9f4f357-4957-4bdf-a8ea-1434d9f801f7',
        member_id: memberId,
        quantity: 2,
        deposit_amount: 50,
        paid_amount: 50,
      },
      tenantId,
      { userId: 'user-1', platformRole: null },
    );

    expect(prisma.preOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          unit_price: null,
          total_amount: null,
          deposit_amount: 50,
          paid_amount: 50,
        }),
      }),
    );
  });

  it('rejects create when paid_amount is less than deposit_amount', async () => {
    prisma.item.findFirst.mockResolvedValue({ id: 'item-1' });
    await expect(
      service.create(
        {
          item_id: 'f9f4f357-4957-4bdf-a8ea-1434d9f801f7',
          member_id: memberId,
          quantity: 1,
          unit_price: 100,
          deposit_amount: 80,
          paid_amount: 30,
        },
        tenantId,
        { userId: 'user-1', platformRole: null },
      ),
    ).rejects.toBeInstanceOf(AppException);
  });

  it('returns admin summary totals', async () => {
    prisma.preOrder.groupBy.mockResolvedValue([
      {
        status: PreOrderStatus.WAITING_FOR_GOODS,
        _count: { _all: 3 },
        _sum: { total_amount: { toNumber: () => 700 }, paid_amount: { toNumber: () => 200 } },
      },
    ]);

    const result = await service.getAdminSummary(tenantId);
    expect(result.summary[0]).toEqual({
      status: PreOrderStatus.WAITING_FOR_GOODS,
      total_orders: 3,
      total_amount: 700,
      total_paid: 200,
    });
  });

  it('allows update to clear expected dates with null', async () => {
    prisma.preOrder.findFirst.mockResolvedValue({
      id: 'po-1',
      shop_id: tenantId,
      user_id: null,
      status: PreOrderStatus.WAITING_FOR_GOODS,
      quantity: 2,
      unit_price: { toNumber: () => 100 },
      deposit_amount: { toNumber: () => 20 },
      paid_amount: { toNumber: () => 20 },
    });
    prisma.userShopRole.findUnique.mockResolvedValue({ role: ShopRole.shop_admin });
    prisma.preOrder.update.mockResolvedValue({ id: 'po-1' });

    await service.update(
      'po-1',
      {
        expected_arrival_at: null,
        expected_delivery_at: null,
      },
      tenantId,
      { userId: 'shop-admin-1', platformRole: null },
    );

    expect(prisma.preOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          expected_arrival_at: null,
          expected_delivery_at: null,
        }),
      }),
    );
  });

  it('rejects create for another user when assignee is not a shop member', async () => {
    prisma.item.findFirst.mockResolvedValue({ id: 'item-1' });
    prisma.userShopRole.findUnique.mockResolvedValue(null);
    await expect(
      service.create(
        {
          item_id: 'f9f4f357-4957-4bdf-a8ea-1434d9f801f7',
          member_id: memberId,
          user_id: '63bbf6a8-7a4f-4e95-a860-2e3b2df8f218',
          quantity: 1,
        },
        tenantId,
        { userId: '4fc7be0b-913e-4e34-a754-d12d6457f174', platformRole: null },
      ),
    ).rejects.toBeInstanceOf(AppException);
  });

  it('allows create for another shop member (same tenant)', async () => {
    prisma.item.findFirst.mockResolvedValue({ id: 'item-1' });
    prisma.userShopRole.findUnique.mockResolvedValue({ user_id: '63bbf6a8-7a4f-4e95-a860-2e3b2df8f218' });
    prisma.preOrder.create.mockResolvedValue({ id: 'new-po' });

    await service.create(
      {
        item_id: 'f9f4f357-4957-4bdf-a8ea-1434d9f801f7',
        member_id: memberId,
        user_id: '63bbf6a8-7a4f-4e95-a860-2e3b2df8f218',
        quantity: 1,
      },
      tenantId,
      { userId: '4fc7be0b-913e-4e34-a754-d12d6457f174', platformRole: null },
    );

    expect(prisma.preOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          user_id: '63bbf6a8-7a4f-4e95-a860-2e3b2df8f218',
        }),
      }),
    );
  });

  it('allows create for arbitrary user when actor is platform_super', async () => {
    prisma.item.findFirst.mockResolvedValue({ id: 'item-1' });
    prisma.preOrder.create.mockResolvedValue({ id: 'new-po' });

    await service.create(
      {
        item_id: 'f9f4f357-4957-4bdf-a8ea-1434d9f801f7',
        member_id: memberId,
        user_id: '63bbf6a8-7a4f-4e95-a860-2e3b2df8f218',
        quantity: 1,
      },
      tenantId,
      { userId: '4fc7be0b-913e-4e34-a754-d12d6457f174', platformRole: PlatformRole.platform_super },
    );

    expect(prisma.userShopRole.findUnique).not.toHaveBeenCalled();
  });

  it('on PAID transition, applies earn via MembersService when member and amounts present', async () => {
    const preorderId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    prisma.preOrder.findFirst
      .mockResolvedValueOnce({
        id: preorderId,
        shop_id: tenantId,
        status: PreOrderStatus.ARRIVED,
        member_id: memberId,
        paid_amount: { toNumber: () => 50_000 },
        total_amount: { toNumber: () => 100_000 },
      })
      .mockResolvedValueOnce({
        id: preorderId,
        shop_id: tenantId,
        status: PreOrderStatus.PAID,
        member_id: memberId,
      });
    prisma.shop.findFirst.mockResolvedValue({
      loyalty_json: { vnd_per_point: 1000, preorder_points_basis: 'paid_amount' },
    });
    prisma.preOrder.updateMany.mockResolvedValue({ count: 1 });

    await service.transitionStatus(preorderId, PreOrderStatus.PAID, tenantId, 'actor-1');

    expect(membersService.applyPreorderPaidPointsIfNeededInTx).toHaveBeenCalledWith(
      prisma,
      expect.objectContaining({
        preorderId,
        memberId,
        basisVnd: 50_000,
        vndPerPoint: 1000,
        actorUserId: 'actor-1',
      }),
    );
  });

  it('returns pagination metadata for my-orders', async () => {
    prisma.preOrder.findMany.mockResolvedValue([]);
    prisma.preOrder.count.mockResolvedValue(3);

    const result = await service.findMyOrders('user-1', tenantId, { page: 1, page_size: 2 });
    expect(result.pagination).toEqual({
      page: 1,
      page_size: 2,
      total: 3,
      total_pages: 2,
    });
  });

  it('rejects update when actor is not owner and not shop admin', async () => {
    prisma.preOrder.findFirst.mockResolvedValue({
      id: 'po-3',
      shop_id: tenantId,
      user_id: 'owner-user',
      quantity: 1,
      unit_price: { toNumber: () => 100 },
      deposit_amount: { toNumber: () => 10 },
      paid_amount: { toNumber: () => 10 },
    });
    prisma.userShopRole.findUnique.mockResolvedValue({ role: ShopRole.shop_staff });

    await expect(
      service.update(
        'po-3',
        { note: 'try update' },
        tenantId,
        { userId: 'other-user', platformRole: null },
      ),
    ).rejects.toBeInstanceOf(AppException);
  });

  it('applies participants pagination from query', async () => {
    prisma.preOrder.findMany.mockResolvedValue([]);
    prisma.preOrder.count.mockResolvedValue(101);
    const result = await service.getCampaignParticipants('item-1', tenantId, { page: 2, page_size: 50 });
    expect(prisma.preOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 50,
        take: 50,
      }),
    );
    expect(result.pagination).toEqual({
      page: 2,
      page_size: 50,
      total: 101,
      total_pages: 3,
    });
  });

  it('rejects financial field updates when pre-order is already paid', async () => {
    prisma.preOrder.findFirst.mockResolvedValue({
      id: 'po-paid',
      shop_id: tenantId,
      user_id: 'owner-user',
      status: PreOrderStatus.PAID,
      quantity: 1,
      unit_price: { toNumber: () => 100 },
      deposit_amount: { toNumber: () => 10 },
      paid_amount: { toNumber: () => 100 },
    });
    prisma.userShopRole.findUnique.mockResolvedValue({ role: ShopRole.shop_admin });

    await expect(
      service.update(
        'po-paid',
        { paid_amount: 50 },
        tenantId,
        { userId: 'admin-user', platformRole: null },
      ),
    ).rejects.toThrow('Cannot change item, quantity, or amounts');
    expect(prisma.preOrder.update).not.toHaveBeenCalled();
  });

  it('handles concurrent transition conflict', async () => {
    prisma.preOrder.findFirst.mockResolvedValueOnce({
      id: 'po-2',
      shop_id: tenantId,
      status: PreOrderStatus.PENDING_CONFIRMATION,
    });
    prisma.preOrder.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.transitionStatus('po-2', PreOrderStatus.WAITING_FOR_GOODS, tenantId, 'u1'),
    ).rejects.toBeInstanceOf(AppException);
  });
});
