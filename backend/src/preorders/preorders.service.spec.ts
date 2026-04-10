import { Test, TestingModule } from '@nestjs/testing';
import { PreOrderStatus } from '../generated/prisma/client';
import { AppException } from '../common/exceptions/http-exception.filter';
import { PrismaService } from '../common/prisma/prisma.service';
import { PreordersService } from './preorders.service';

describe('PreordersService', () => {
  let service: PreordersService;
  const prisma = {
    shop: { findFirst: jest.fn() },
    item: { findFirst: jest.fn() },
    preOrder: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };
  const storage = { getFileUrl: jest.fn((path: string) => `http://localhost/${path}`) };

  const tenantId = '00000000-0000-0000-0000-000000000001';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreordersService,
        { provide: PrismaService, useValue: prisma },
        { provide: 'IStorageService', useValue: storage },
      ],
    }).compile();

    service = module.get<PreordersService>(PreordersService);
    jest.clearAllMocks();
  });

  it('rejects invalid transition', async () => {
    prisma.preOrder.findFirst.mockResolvedValue({
      id: 'po-1',
      shop_id: tenantId,
      status: PreOrderStatus.PAID,
    });

    await expect(
      service.transitionStatus('po-1', PreOrderStatus.WAITING_FOR_GOODS, tenantId),
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
          item_images: [{ file_path: 'images/cover.jpg' }],
        },
      },
    ]);

    const result = await service.findPublicCards(tenantId, { page: 1, page_size: 10 });
    expect(result.cards[0]).toEqual(
      expect.objectContaining({
        status: PreOrderStatus.WAITING_FOR_GOODS,
        countdown_target: expect.any(Date),
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
          quantity: 1,
          unit_price: 100,
          deposit_amount: 120,
        },
        tenantId,
        { userId: 'user-1', role: 'admin' },
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
      quantity: 2,
      unit_price: { toNumber: () => 100 },
      deposit_amount: { toNumber: () => 20 },
      paid_amount: { toNumber: () => 20 },
    });
    prisma.preOrder.update.mockResolvedValue({ id: 'po-1' });

    await service.update(
      'po-1',
      {
        expected_arrival_at: null,
        expected_delivery_at: null,
      },
      tenantId,
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

  it('rejects create for another user when actor is not admin', async () => {
    prisma.item.findFirst.mockResolvedValue({ id: 'item-1' });
    await expect(
      service.create(
        {
          item_id: 'f9f4f357-4957-4bdf-a8ea-1434d9f801f7',
          user_id: '63bbf6a8-7a4f-4e95-a860-2e3b2df8f218',
          quantity: 1,
        },
        tenantId,
        { userId: '4fc7be0b-913e-4e34-a754-d12d6457f174', role: 'member' },
      ),
    ).rejects.toBeInstanceOf(AppException);
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

  it('handles concurrent transition conflict', async () => {
    prisma.preOrder.findFirst.mockResolvedValueOnce({
      id: 'po-2',
      shop_id: tenantId,
      status: PreOrderStatus.PENDING_CONFIRMATION,
    });
    prisma.preOrder.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.transitionStatus('po-2', PreOrderStatus.WAITING_FOR_GOODS, tenantId),
    ).rejects.toBeInstanceOf(AppException);
  });
});
