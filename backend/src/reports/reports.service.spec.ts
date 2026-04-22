import { Test, TestingModule } from '@nestjs/testing';
import { InventoryTransactionType, PreOrderStatus } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  const prisma = {
    inventoryTransaction: {
      findMany: jest.fn(),
    },
    preOrder: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    facebookPost: {
      findMany: jest.fn(),
    },
    item: {
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-22T12:00:00.000Z'));
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('aggregates summary KPI deterministically for a range', async () => {
    prisma.inventoryTransaction.findMany.mockResolvedValue([
      { type: InventoryTransactionType.stock_in, quantity: 10, delta: 10 },
      { type: InventoryTransactionType.stock_out, quantity: 4, delta: -4 },
      { type: InventoryTransactionType.adjustment, quantity: 2, delta: -2 },
    ]);
    prisma.preOrder.findMany
      .mockResolvedValueOnce([
        { total_amount: { toNumber: () => 1000 } },
        { total_amount: { toNumber: () => 500 } },
      ])
      .mockResolvedValueOnce([{ total_amount: { toNumber: () => 500 } }]);
    prisma.facebookPost.findMany.mockResolvedValue([{ id: 'fb-1' }, { id: 'fb-2' }]);
    prisma.item.aggregate.mockResolvedValue({ _sum: { quantity: 42 } });
    prisma.preOrder.count.mockResolvedValue(3);

    const result = await service.getSummary('shop-1', '7d');

    expect(result.range).toBe('7d');
    expect(result.summary).toEqual(
      expect.objectContaining({
        stock_in_units: 10,
        stock_out_units: 4,
        adjustment_net_units: -2,
        movement_units: 16,
        preorder_created_count: 2,
        preorder_paid_count: 1,
        preorder_created_revenue: 1500,
        preorder_paid_revenue: 500,
        facebook_post_count: 2,
        current_stock_units: 42,
        active_preorder_count: 3,
      }),
    );
  });

  it('uses gross adjustment movement for movement_units instead of net-only', async () => {
    prisma.inventoryTransaction.findMany.mockResolvedValue([
      { type: InventoryTransactionType.adjustment, quantity: 5, delta: 5 },
      { type: InventoryTransactionType.adjustment, quantity: 5, delta: -5 },
    ]);
    prisma.preOrder.findMany.mockResolvedValue([]);
    prisma.facebookPost.findMany.mockResolvedValue([]);
    prisma.item.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });
    prisma.preOrder.count.mockResolvedValue(0);

    const result = await service.getSummary('shop-1', '7d');

    expect(result.summary.adjustment_net_units).toBe(0);
    expect(result.summary.movement_units).toBe(10);
  });

  it('returns trend series with zero-filled buckets and metric counts', async () => {
    prisma.inventoryTransaction.findMany.mockResolvedValue([
      {
        quantity: 3,
        delta: 3,
        created_at: new Date('2026-04-21T10:00:00.000Z'),
      },
    ]);
    prisma.preOrder.findMany
      .mockResolvedValueOnce([
        {
          total_amount: { toNumber: () => 900 },
          created_at: new Date('2026-04-21T12:00:00.000Z'),
        },
      ])
      .mockResolvedValueOnce([{ completed_at: new Date('2026-04-21T13:00:00.000Z') }]);
    prisma.facebookPost.findMany.mockResolvedValue([
      { posted_at: new Date('2026-04-21T09:00:00.000Z') },
    ]);

    const result = await service.getTrends('shop-1', '7d', 'day');

    expect(result.bucket).toBe('day');
    expect(result.series.length).toBeGreaterThan(0);
    const populated = result.series.find((point) =>
      point.bucket_start.startsWith('2026-04-21'),
    );
    expect(populated).toEqual(
      expect.objectContaining({
        inventory_movement_units: 3,
        preorder_created_count: 1,
        preorder_paid_count: 1,
        preorder_revenue: 900,
        facebook_post_count: 1,
      }),
    );
  });

  it('uses 30d range by default when not provided', async () => {
    prisma.inventoryTransaction.findMany.mockResolvedValue([]);
    prisma.preOrder.findMany.mockResolvedValue([]);
    prisma.facebookPost.findMany.mockResolvedValue([]);
    prisma.item.aggregate.mockResolvedValue({ _sum: { quantity: 0 } });
    prisma.preOrder.count.mockResolvedValue(0);

    const result = await service.getSummary('shop-1');

    expect(result.range).toBe('30d');
    expect(prisma.inventoryTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          created_at: expect.objectContaining({
            gte: new Date('2026-03-24T00:00:00.000Z'),
            lt: new Date('2026-04-22T23:59:59.999Z'),
          }),
        }),
      }),
    );
  });

  it('aggregates trends by week boundaries when requested', async () => {
    prisma.inventoryTransaction.findMany.mockResolvedValue([
      {
        quantity: 2,
        delta: 2,
        created_at: new Date('2026-04-20T00:00:00.000Z'),
      },
    ]);
    prisma.preOrder.findMany.mockResolvedValue([]);
    prisma.facebookPost.findMany.mockResolvedValue([]);

    const result = await service.getTrends('shop-1', '30d', 'week');

    expect(result.bucket).toBe('week');
    const mondayBucket = result.series.find((point) =>
      point.bucket_start.startsWith('2026-04-20'),
    );
    expect(mondayBucket?.inventory_movement_units).toBe(2);
  });

  it('counts only paid preorders in paid metric query', async () => {
    prisma.inventoryTransaction.findMany.mockResolvedValue([]);
    prisma.preOrder.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    prisma.facebookPost.findMany.mockResolvedValue([]);
    prisma.item.aggregate.mockResolvedValue({ _sum: { quantity: 1 } });
    prisma.preOrder.count.mockResolvedValue(0);

    await service.getSummary('shop-1', '90d');

    expect(prisma.preOrder.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          status: PreOrderStatus.PAID,
          completed_at: expect.any(Object),
        }),
      }),
    );
  });
});
