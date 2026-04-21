import { Test, TestingModule } from '@nestjs/testing';
import { InventoryTransactionType } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { InventoryService } from './inventory.service';

describe('Inventory reconciliation sequence', () => {
  let service: InventoryService;

  const itemState = { quantity: 5 };
  const ledger: Array<{ delta: number; resulting_quantity: number }> = [];
  const prisma = {
    item: {
      findFirst: jest.fn(async () => ({
        id: 'item-1',
        status: 'con_hang',
        quantity: itemState.quantity,
        shop_id: 'shop-1',
      })),
      findUnique: jest.fn(async () => ({ quantity: itemState.quantity })),
      update: jest.fn(async ({ data }: { data: { quantity: number } }) => {
        itemState.quantity = data.quantity;
        return { id: 'item-1', quantity: itemState.quantity };
      }),
    },
    inventoryTransaction: {
      create: jest.fn(async ({ data }: { data: { delta: number; resulting_quantity: number } }) => {
        const row = {
          id: `txn-${ledger.length + 1}`,
          ...data,
        };
        ledger.push({ delta: data.delta, resulting_quantity: data.resulting_quantity });
        return row;
      }),
      findMany: jest.fn(async ({ where }: { where?: { reversal_of_id?: string } } = {}) => {
        if (where?.reversal_of_id) return [];
        return [...ledger];
      }),
      findFirst: jest.fn(async ({ where }: { where?: { id?: string; reversal_of_id?: string } } = {}) => {
        if (where?.reversal_of_id) return null;
        if (where?.id) {
          return {
            id: where.id,
            item_id: 'item-1',
            shop_id: 'shop-1',
            reversal_of_id: null,
            type: InventoryTransactionType.stock_in,
            quantity: 2,
            delta: 2,
            resulting_quantity: itemState.quantity,
            reason: 'Initial wrong import',
          };
        }
        return null;
      }),
      count: jest.fn(async () => ledger.length),
    },
    $queryRaw: jest.fn(async () => [{
      id: 'item-1',
      quantity: itemState.quantity,
      status: 'con_hang',
      shop_id: 'shop-1',
    }]),
    $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
  };

  beforeEach(async () => {
    itemState.quantity = 5;
    ledger.splice(0, ledger.length);
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<InventoryService>(InventoryService);
  });

  it('keeps reconciliation consistent across mixed transaction sequence', async () => {
    await service.createTransaction(
      'item-1',
      { type: InventoryTransactionType.stock_in, quantity: 4, reason: 'Import' },
      'shop-1',
      'user-1',
    );
    await service.createTransaction(
      'item-1',
      { type: InventoryTransactionType.stock_out, quantity: 3, reason: 'Sold offline' },
      'shop-1',
      'user-1',
    );
    await service.createTransaction(
      'item-1',
      {
        type: InventoryTransactionType.adjustment,
        quantity: 1,
        adjustment_delta: -1,
        reason: 'Damage correction',
      },
      'shop-1',
      'user-1',
    );

    const reconciliation = await service.getReconciliation('item-1', 'shop-1');
    expect(reconciliation.ok).toBe(true);
    expect(reconciliation.current_quantity).toBe(5);
    expect(reconciliation.ledger_last_quantity).toBe(5);
    expect(reconciliation.ledger_count).toBe(3);
  });

  it('reverses a transaction and restores quantity', async () => {
    itemState.quantity = 7;
    const result = await service.reverseTransaction(
      'item-1',
      'txn-origin',
      'shop-1',
      'user-1',
      'Operator reverted mistake',
      'wrong import',
    );

    expect(result.transaction.delta).toBe(-2);
    expect(itemState.quantity).toBe(5);
  });
});
