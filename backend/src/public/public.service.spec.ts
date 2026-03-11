import { Test, TestingModule } from '@nestjs/testing';
import { PublicService } from './public.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/http-exception.filter';

describe('PublicService', () => {
  let service: PublicService;
  let prisma: {
    item: Record<string, jest.Mock>;
  };
  let storage: Record<string, jest.Mock>;

  const mockPublicItem = {
    id: 'item-1',
    name: 'Public Item',
    description: 'A description',
    scale: '1:64',
    brand: 'Hot Wheels',
    car_brand: 'Toyota',
    model_brand: null,
    condition: 'new',
    price: { toNumber: () => 50 },
    original_price: null,
    status: 'con_hang',
    is_public: true,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    item_images: [{ file_path: 'images/cover.jpg' }],
    spin_sets: [],
  };

  beforeEach(async () => {
    prisma = {
      item: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
      },
    };

    storage = {
      getFileUrl: jest.fn((path: string) => `http://localhost/uploads/${path}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicService,
        { provide: PrismaService, useValue: prisma },
        { provide: 'IStorageService', useValue: storage },
      ],
    }).compile();

    service = module.get<PublicService>(PublicService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // findAll
  // ============================================================
  describe('findAll', () => {
    it('should return paginated public items', async () => {
      prisma.item.findMany.mockResolvedValue([mockPublicItem]);
      prisma.item.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].cover_image_url).toContain('cover.jpg');
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter by car_brand', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({ car_brand: 'Toyota' });

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.car_brand).toBe('Toyota');
    });

    it('should filter by condition', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({ condition: 'old' });

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.condition).toBe('old');
    });

    it('should filter by status', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({ status: 'con_hang' });

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.status).toBe('con_hang');
    });

    it('should trim car_brand and model_brand filters and ignore whitespace-only values', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({
        car_brand: '  Nissan ',
        model_brand: '   ',
      });

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.car_brand).toBe('Nissan');
      expect(findManyCall.where.model_brand).toBeUndefined();
    });

    it('should filter by search query', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({ q: '  civic ' });

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.name).toEqual({ contains: 'civic', mode: 'insensitive' });
    });

    it('should not add name filter for whitespace-only search query', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({ q: '   ' });

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.name).toBeUndefined();
    });

    it('should support custom sorting', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({ sort_by: 'name', sort_order: 'asc' });

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.orderBy).toEqual([
        { name: 'asc' },
        { created_at: 'desc' },
        { id: 'desc' },
      ]);
    });

    it('should support created_at sorting with id tie-breaker in same order', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({ sort_by: 'created_at', sort_order: 'asc' });

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.orderBy).toEqual([{ created_at: 'asc' }, { id: 'asc' }]);
    });

    it('should always filter by is_public=true and deleted_at=null', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({});

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.is_public).toBe(true);
      expect(findManyCall.where.deleted_at).toBeNull();
    });

    it('should calculate skip/take correctly with valid page_size', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({ page: 2, page_size: 50 });

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.skip).toBe(50);
      expect(findManyCall.take).toBe(50);
    });

    it('should use skip=0 on first page', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({ page: 1, page_size: 20 });

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.skip).toBe(0);
      expect(findManyCall.take).toBe(20);
    });

    it('should clamp page_size to MAX (100) and recalculate skip correctly', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({ page: 2, page_size: 999 });

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.skip).toBe(100);
      expect(findManyCall.take).toBe(100);
    });

    it('should reuse cached count for repeated requests with identical filters', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(12);

      const firstResult = await service.findAll({ page: 1, page_size: 10, car_brand: 'Toyota' });
      const secondResult = await service.findAll({ page: 2, page_size: 10, car_brand: 'Toyota' });

      expect(prisma.item.count).toHaveBeenCalledTimes(1);
      expect(firstResult.pagination.total).toBe(12);
      expect(secondResult.pagination.total).toBe(12);
    });

    it('should expose has_spinner=true only when default spin set has frames', async () => {
      prisma.item.findMany.mockResolvedValue([
        {
          ...mockPublicItem,
          item_images: [{ file_path: 'images/cover.jpg', is_cover: true, display_order: 0 }],
          spin_sets: [{ id: 'spin-1', frames: [] }],
        },
      ]);
      prisma.item.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.items[0].has_spinner).toBe(false);
    });
  });

  // ============================================================
  // findOne
  // ============================================================
  describe('findOne', () => {
    it('should return item with images and spinner', async () => {
      const mockFullItem = {
        ...mockPublicItem,
        item_images: [
          {
            id: 'img-1',
            item_id: 'item-1',
            file_path: 'images/1.jpg',
            thumbnail_path: 'thumbs/1.jpg',
            is_cover: true,
            display_order: 0,
            created_at: new Date(),
          },
        ],
        spin_sets: [
          {
            id: 'spin-1',
            item_id: 'item-1',
            label: 'Default',
            is_default: true,
            created_at: new Date(),
            updated_at: new Date(),
            frames: [
              {
                id: 'frame-1',
                spin_set_id: 'spin-1',
                frame_index: 0,
                file_path: 'spinner/f0.jpg',
                thumbnail_path: 'spinner/t0.jpg',
                created_at: new Date(),
              },
            ],
          },
        ],
      };

      prisma.item.findFirst.mockResolvedValue(mockFullItem);

      const result = await service.findOne('item-1');

      expect(result.item.id).toBe('item-1');
      expect(result.images).toHaveLength(1);
      expect(result.spinner).not.toBeNull();
      expect(result.spinner!.frames).toHaveLength(1);
    });

    it('should throw NOT_FOUND when item does not exist', async () => {
      prisma.item.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(AppException);
    });

    it('should keep spinner frame order from database and drop invalid frame paths', async () => {
      prisma.item.findFirst.mockResolvedValue({
        ...mockPublicItem,
        item_images: [
          {
            id: 'img-2',
            item_id: 'item-1',
            file_path: '',
            thumbnail_path: null,
            is_cover: false,
            display_order: 1,
            created_at: new Date(),
          },
          {
            id: 'img-1',
            item_id: 'item-1',
            file_path: 'images/valid.jpg',
            thumbnail_path: null,
            is_cover: true,
            display_order: 0,
            created_at: new Date(),
          },
        ],
        spin_sets: [
          {
            id: 'spin-1',
            item_id: 'item-1',
            label: 'Default',
            is_default: true,
            created_at: new Date(),
            updated_at: new Date(),
            frames: [
              {
                id: 'f-2',
                spin_set_id: 'spin-1',
                frame_index: 2,
                file_path: 'spinner/2.jpg',
                thumbnail_path: null,
                created_at: new Date(),
              },
              {
                id: 'f-1',
                spin_set_id: 'spin-1',
                frame_index: 1,
                file_path: '',
                thumbnail_path: null,
                created_at: new Date(),
              },
            ],
          },
        ],
      });

      const result = await service.findOne('item-1');

      expect(result.images).toHaveLength(1);
      expect(result.images[0].url).toContain('images/valid.jpg');
      expect(result.spinner?.frames.map((f) => f.frame_index)).toEqual([2]);
    });

    it('should filter out images with empty file_path in findOne response', async () => {
      prisma.item.findFirst.mockResolvedValue({
        ...mockPublicItem,
        item_images: [
          {
            id: 'img-1',
            item_id: 'item-1',
            file_path: '   ',
            thumbnail_path: null,
            is_cover: false,
            display_order: 1,
            created_at: new Date(),
          },
          {
            id: 'img-2',
            item_id: 'item-1',
            file_path: 'images/ok.jpg',
            thumbnail_path: null,
            is_cover: true,
            display_order: 0,
            created_at: new Date(),
          },
        ],
        spin_sets: [],
      });

      const result = await service.findOne('item-1');

      expect(result.images).toHaveLength(1);
      expect(result.images[0].url).toContain('images/ok.jpg');
    });

    it('should return null spinner when no default spin set', async () => {
      prisma.item.findFirst.mockResolvedValue({
        ...mockPublicItem,
        spin_sets: [],
      });

      const result = await service.findOne('item-1');

      expect(result.spinner).toBeNull();
    });

    it('should query only public and non-deleted item records in findOne', async () => {
      prisma.item.findFirst.mockResolvedValue(null);

      await expect(service.findOne('item-1')).rejects.toThrow(AppException);

      const findFirstCall = prisma.item.findFirst.mock.calls[0][0];
      expect(findFirstCall.where).toMatchObject({
        id: 'item-1',
        is_public: true,
        deleted_at: null,
      });
    });
  });
});
