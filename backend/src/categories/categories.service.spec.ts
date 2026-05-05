import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: {
    category: Record<string, jest.Mock>;
    item: Record<string, jest.Mock>;
    shop: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };

  const SHOP_A = '00000000-0000-0000-0000-0000000000aa';

  const mockGlobalCategory = {
    id: 'cat-1',
    shop_id: null as string | null,
    name: 'BMW',
    type: 'car_brand',
    is_active: true,
    display_order: 0,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      category: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      item: {
        count: jest.fn(),
        updateMany: jest.fn(),
      },
      shop: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(async (arg: unknown) => {
        if (typeof arg === 'function') {
          return arg(prisma);
        }
        const ops = arg as Promise<unknown>[];
        const results = [];
        for (const op of ops) {
          results.push(await op);
        }
        return results;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);

    jest.spyOn((service as unknown as { logger: { log: jest.Mock } }).logger, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('merges global + shop rows when shop_id query resolves', async () => {
      prisma.shop.findFirst.mockResolvedValue({ id: SHOP_A });
      prisma.category.findMany.mockResolvedValue([mockGlobalCategory]);

      await service.findAll({ type: 'car_brand', shop_id: SHOP_A }, {});

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ shop_id: null }, { shop_id: { in: [SHOP_A] } }],
          type: 'car_brand',
        },
        orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
      });
    });

    it('platform super without shop returns all rows', async () => {
      prisma.category.findMany.mockResolvedValue([]);

      await service.findAll({}, { isPlatformSuper: true });

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
      });
    });
  });

  describe('createGlobal', () => {
    it('creates category with shop_id null', async () => {
      prisma.category.findFirst.mockResolvedValue(null);
      prisma.category.aggregate.mockResolvedValue({ _max: { display_order: 5 } });
      prisma.category.create.mockResolvedValue({ ...mockGlobalCategory, display_order: 6 });

      await service.createGlobal({ name: 'Audi', type: 'car_brand' });

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: {
          shop_id: null,
          name: 'Audi',
          type: 'car_brand',
          display_order: 6,
        },
      });
    });
  });

  describe('createForShop', () => {
    it('creates scoped category', async () => {
      prisma.category.findFirst.mockResolvedValue(null);
      prisma.category.aggregate.mockResolvedValue({ _max: { display_order: null } });
      prisma.category.create.mockResolvedValue({
        ...mockGlobalCategory,
        shop_id: SHOP_A,
        display_order: 0,
      });

      await service.createForShop({ name: 'Custom', type: 'car_brand' }, SHOP_A);

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: {
          shop_id: SHOP_A,
          name: 'Custom',
          type: 'car_brand',
          display_order: 0,
        },
      });
    });
  });

  describe('update', () => {
    it('shop admin cannot rename global category', async () => {
      prisma.category.findUnique.mockResolvedValue(mockGlobalCategory);

      await expect(
        service.update('cat-1', { name: 'X' }, { tenantId: SHOP_A, isPlatformSuper: false }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('platform super can rename global category', async () => {
      prisma.category.findUnique.mockResolvedValueOnce(mockGlobalCategory);
      prisma.category.findFirst.mockResolvedValue(null);
      prisma.$transaction.mockResolvedValue([{ ...mockGlobalCategory, name: 'BMW Group' }, { count: 1 }]);
      prisma.item.count.mockResolvedValue(1);

      const result = await service.update(
        'cat-1',
        { name: 'BMW Group' },
        { isPlatformSuper: true },
      );

      expect(result.category.name).toBe('BMW Group');
    });
  });
});
