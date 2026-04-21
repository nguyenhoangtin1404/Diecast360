import { Test, TestingModule } from '@nestjs/testing';
import { InventoryTransactionType } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { ErrorCode } from '../common/constants/error-codes';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;
  const prisma = {
    item: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    inventoryTransaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.$queryRaw.mockImplementation(async () => {
      const item = await prisma.item.findFirst();
      if (!item) return [];
      return [item];
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('creates stock-in transaction and updates quantity', async () => {
    prisma.item.findFirst.mockResolvedValueOnce({
      id: 'item-1',
      status: 'con_hang',
      quantity: 2,
      shop_id: 'shop-1',
    });
    prisma.item.update.mockResolvedValue({});
    prisma.inventoryTransaction.create.mockResolvedValue({ id: 'txn-1', resulting_quantity: 5 });

    const result = await service.createTransaction(
      'item-1',
      {
        type: InventoryTransactionType.stock_in,
        quantity: 3,
        reason: 'Import shipment',
      },
      'shop-1',
      'user-1',
    );

    expect(prisma.item.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { quantity: 5 },
    });
    expect(result.transaction.id).toBe('txn-1');
  });

  it('rejects stock-out that would make inventory negative', async () => {
    prisma.item.findFirst.mockResolvedValueOnce({
      id: 'item-1',
      status: 'con_hang',
      quantity: 1,
      shop_id: 'shop-1',
    });

    await expect(
      service.createTransaction(
        'item-1',
        {
          type: InventoryTransactionType.stock_out,
          quantity: 3,
          reason: 'Manual export',
        },
        'shop-1',
        'user-1',
      ),
    ).rejects.toMatchObject({
      errorCode: ErrorCode.VALIDATION_ERROR,
    });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('supports adjustment with explicit delta', async () => {
    prisma.item.findFirst.mockResolvedValueOnce({
      id: 'item-1',
      status: 'con_hang',
      quantity: 10,
      shop_id: 'shop-1',
    });
    prisma.inventoryTransaction.create.mockResolvedValue({ id: 'txn-2', resulting_quantity: 6 });

    await service.createTransaction(
      'item-1',
      {
        type: InventoryTransactionType.adjustment,
        quantity: 4,
        adjustment_delta: -4,
        reason: 'Count correction',
      },
      'shop-1',
      'user-1',
    );

    expect(prisma.item.update).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { quantity: 6 },
    });
  });

  it('rejects adjustment when quantity does not match abs(delta)', async () => {
    prisma.item.findFirst.mockResolvedValueOnce({
      id: 'item-1',
      status: 'con_hang',
      quantity: 10,
      shop_id: 'shop-1',
    });

    await expect(
      service.createTransaction(
        'item-1',
        {
          type: InventoryTransactionType.adjustment,
          quantity: 1,
          adjustment_delta: -4,
          reason: 'Count correction',
        },
        'shop-1',
        'user-1',
      ),
    ).rejects.toMatchObject({
      errorCode: ErrorCode.VALIDATION_ERROR,
    });
  });
});
