import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: {
    category: Record<string, jest.Mock>;
    item: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };

  const mockCategory = {
    id: 'cat-1',
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
      $transaction: jest.fn(async (operations: Promise<unknown>[]) => {
        const results = [];
        for (const op of operations) {
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

    // Suppress logger output in tests
    jest.spyOn((service as unknown as { logger: any }).logger, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // findAll
  // ============================================================
  describe('findAll', () => {
    it('should return all categories without filters', async () => {
      prisma.category.findMany.mockResolvedValue([mockCategory]);

      const result = await service.findAll({});

      expect(result).toEqual({ categories: [mockCategory] });
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
      });
    });

    it('should filter by type', async () => {
      prisma.category.findMany.mockResolvedValue([mockCategory]);

      await service.findAll({ type: 'car_brand' });

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { type: 'car_brand' },
        orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
      });
    });

    it('should filter by is_active', async () => {
      prisma.category.findMany.mockResolvedValue([]);

      await service.findAll({ is_active: true });

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { is_active: true },
        orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
      });
    });

    it('should filter by both type and is_active', async () => {
      prisma.category.findMany.mockResolvedValue([]);

      await service.findAll({ type: 'model_brand', is_active: false });

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { type: 'model_brand', is_active: false },
        orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
      });
    });
  });

  // ============================================================
  // findOne
  // ============================================================
  describe('findOne', () => {
    it('should return a category by id', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findOne('cat-1');

      expect(result).toEqual({ category: mockCategory });
    });

    it('should throw NotFoundException if category not found', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.findOne('not-exist')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================================
  // create
  // ============================================================
  describe('create', () => {
    it('should create a new category with auto display_order', async () => {
      prisma.category.findUnique.mockResolvedValue(null); // no duplicate
      prisma.category.aggregate.mockResolvedValue({ _max: { display_order: 5 } });
      prisma.category.create.mockResolvedValue({ ...mockCategory, display_order: 6 });

      const result = await service.create({ name: 'BMW', type: 'car_brand' });

      expect(result.category.display_order).toBe(6);
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: { name: 'BMW', type: 'car_brand', display_order: 6 },
      });
    });

    it('should create with explicit display_order', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      prisma.category.create.mockResolvedValue({ ...mockCategory, display_order: 10 });

      await service.create({ name: 'BMW', type: 'car_brand', display_order: 10 });

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: { name: 'BMW', type: 'car_brand', display_order: 10 },
      });
      // aggregate should NOT be called when display_order is provided
      expect(prisma.category.aggregate).not.toHaveBeenCalled();
    });

    it('should set display_order to 0 when no categories exist', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      prisma.category.aggregate.mockResolvedValue({ _max: { display_order: null } });
      prisma.category.create.mockResolvedValue({ ...mockCategory, display_order: 0 });

      await service.create({ name: 'BMW', type: 'car_brand' });

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: { name: 'BMW', type: 'car_brand', display_order: 0 },
      });
    });

    it('should throw ConflictException if duplicate name+type exists', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory); // duplicate found

      await expect(
        service.create({ name: 'BMW', type: 'car_brand' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ============================================================
  // update
  // ============================================================
  describe('update', () => {
    it('should update name and cascade rename to items', async () => {
      prisma.category.findUnique
        .mockResolvedValueOnce(mockCategory) // existing
        .mockResolvedValueOnce(null); // no duplicate

      const updatedCategory = { ...mockCategory, name: 'BMW Group' };
      prisma.category.update.mockResolvedValue(updatedCategory);
      prisma.item.updateMany.mockResolvedValue({ count: 3 });
      prisma.item.count.mockResolvedValue(3);

      // $transaction returns array of results
      prisma.$transaction.mockResolvedValue([updatedCategory, { count: 3 }]);

      const result = await service.update('cat-1', { name: 'BMW Group' });

      expect(result.category.name).toBe('BMW Group');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should update display_order without triggering rename cascade', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);
      const updatedCategory = { ...mockCategory, display_order: 5 };
      prisma.category.update.mockResolvedValue(updatedCategory);

      const result = await service.update('cat-1', { display_order: 5 });

      expect(result.category.display_order).toBe(5);
      // Should NOT trigger transaction for non-rename updates
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { display_order: 5 },
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.update('not-exist', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if rename conflicts with existing name', async () => {
      prisma.category.findUnique
        .mockResolvedValueOnce(mockCategory) // existing category
        .mockResolvedValueOnce({ id: 'cat-2', name: 'Audi', type: 'car_brand' }); // conflict

      await expect(
        service.update('cat-1', { name: 'Audi' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should skip duplicate check if name is unchanged', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);
      prisma.category.update.mockResolvedValue(mockCategory);

      await service.update('cat-1', { name: 'BMW' }); // same name

      // findUnique should only be called once (for the existing check, not for duplicate)
      expect(prisma.category.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // toggleActive
  // ============================================================
  describe('toggleActive', () => {
    it('should toggle active → inactive', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);
      prisma.category.update.mockResolvedValue({ ...mockCategory, is_active: false });

      const result = await service.toggleActive('cat-1');

      expect(result.category.is_active).toBe(false);
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { is_active: false },
      });
    });

    it('should toggle inactive → active', async () => {
      const inactiveCategory = { ...mockCategory, is_active: false };
      prisma.category.findUnique.mockResolvedValue(inactiveCategory);
      prisma.category.update.mockResolvedValue({ ...inactiveCategory, is_active: true });

      const result = await service.toggleActive('cat-1');

      expect(result.category.is_active).toBe(true);
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { is_active: true },
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.toggleActive('not-exist')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================================
  // remove
  // ============================================================
  describe('remove', () => {
    it('should delete category when not in use', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);
      prisma.item.count.mockResolvedValue(0); // not in use

      const result = await service.remove('cat-1');

      expect(result).toEqual({ message: 'Đã xoá danh mục thành công' });
      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
    });

    it('should throw ConflictException when category is in use by items', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);
      prisma.item.count.mockResolvedValue(5); // used by 5 items

      await expect(service.remove('cat-1')).rejects.toThrow(ConflictException);
      expect(prisma.category.delete).not.toHaveBeenCalled();
    });

    it('should check correct item field based on category type', async () => {
      // Test car_brand → checks car_brand field
      prisma.category.findUnique.mockResolvedValue(mockCategory);
      prisma.item.count.mockResolvedValue(0);

      await service.remove('cat-1');

      expect(prisma.item.count).toHaveBeenCalledWith({
        where: { car_brand: 'BMW', deleted_at: null },
      });

      // Test model_brand → checks model_brand field
      jest.clearAllMocks();
      const modelCategory = { ...mockCategory, type: 'model_brand', name: 'Mini GT' };
      prisma.category.findUnique.mockResolvedValue(modelCategory);
      prisma.item.count.mockResolvedValue(0);

      await service.remove('cat-1');

      expect(prisma.item.count).toHaveBeenCalledWith({
        where: { model_brand: 'Mini GT', deleted_at: null },
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.remove('not-exist')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
