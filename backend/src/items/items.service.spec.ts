import { Test, TestingModule } from '@nestjs/testing';
import { ItemsService } from './items.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { VectorStoreService } from '../ai/vector-store.service';
import { EmbeddingService } from '../ai/embedding.service';
import { ErrorCode } from '../common/constants/error-codes';
import { AppException } from '../common/exceptions/http-exception.filter';
import { ItemStatus } from '../generated/prisma/client';


describe('ItemsService', () => {
  let service: ItemsService;
  let prisma: {
    item: Record<string, jest.Mock>;
    aiItemDraft: Record<string, jest.Mock>;
    itemImage: Record<string, jest.Mock>;
    facebookPost: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };
  let storage: {
    moveFile: jest.Mock;
    getFileUrl: jest.Mock;
    saveFile: jest.Mock;
    deleteFile: jest.Mock;
  };
  let loggerErrorSpy: jest.SpyInstance;

  const mockItem = {
    id: 'item-123',
    name: 'Test Item',
    description: 'desc',
    scale: '1:64',
    brand: 'Hot Wheels',
    car_brand: null,
    model_brand: null,
    condition: null,
    price: null,
    original_price: null,
    status: 'con_hang',
    is_public: false,
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    fb_post_content: null,
  };

  beforeEach(async () => {
    storage = {
      moveFile: jest.fn(),
      getFileUrl: jest.fn((path: string) => `http://localhost/uploads/${path}`),
      saveFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    prisma = {
      item: {
        create: jest.fn().mockResolvedValue(mockItem),
        update: jest.fn().mockResolvedValue(mockItem),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      aiItemDraft: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      itemImage: {
        create: jest.fn(),
      },
      facebookPost: {
        create: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(async (fn: (prisma: unknown) => Promise<unknown>) => fn(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        { provide: PrismaService, useValue: prisma },
        { provide: 'IStorageService', useValue: storage },
        { provide: VectorStoreService, useValue: { upsertItem: jest.fn(), deleteItem: jest.fn(), search: jest.fn() } },
        { provide: EmbeddingService, useValue: { getEmbedding: jest.fn().mockResolvedValue([]) } },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);

    // Spy on logger.error to verify structured logging
    jest.spyOn((service as unknown as { logger: { error: jest.Mock } }).logger, 'error').mockImplementation();
    loggerErrorSpy = jest.spyOn((service as unknown as { logger: { error: jest.Mock } }).logger, 'error');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create item without draft', async () => {
      const result = await service.create({ name: 'Test Item' });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.item.create).toHaveBeenCalled();
      expect(result.item).toBeDefined();
      expect(result.item.id).toBe('item-123');
      expect(result).not.toHaveProperty('warning');
    });

    it('should create item with draft and process all images successfully', async () => {
      const mockDraft = {
        id: 'draft-1',
        images_json: JSON.stringify([
          'http://localhost/uploads/drafts/img1.jpg',
          'http://localhost/uploads/drafts/img2.jpg',
        ]),
        status: 'PENDING',
      };

      prisma.aiItemDraft.findUnique.mockResolvedValue(mockDraft);
      storage.moveFile.mockResolvedValue('images/item_123_moved.jpg');

      const result = await service.create({
        name: 'Test Item',
        draft_id: 'draft-1',
      });

      expect(result.item).toBeDefined();
      expect(result).not.toHaveProperty('warning');
      expect(storage.moveFile).toHaveBeenCalledTimes(2);
      expect(prisma.itemImage.create).toHaveBeenCalledTimes(2);
      // Draft should be CONFIRMED when all images succeed
      expect(prisma.aiItemDraft.update).toHaveBeenCalledWith({
        where: { id: 'draft-1' },
        data: { status: 'CONFIRMED' },
      });
      // No notes should be set
      expect(prisma.item.update).not.toHaveBeenCalled();
      expect(loggerErrorSpy).not.toHaveBeenCalled();
    });

    it('should mark item with notes and return warning when some images fail', async () => {
      const mockDraft = {
        id: 'draft-2',
        images_json: JSON.stringify([
          'http://localhost/uploads/drafts/good.jpg',
          'http://localhost/uploads/drafts/bad.jpg',
        ]),
        status: 'PENDING',
      };

      prisma.aiItemDraft.findUnique.mockResolvedValue(mockDraft);
      storage.moveFile
        .mockResolvedValueOnce('images/good_moved.jpg')
        .mockRejectedValueOnce(new Error('File not found'));

      const result = await service.create({
        name: 'Test Item',
        draft_id: 'draft-2',
      });

      expect(result.item).toBeDefined();

      // Should return warning in response
      expect(result).toHaveProperty('warning');
      expect(result.warning!.code).toBe(ErrorCode.DRAFT_IMAGE_PROCESSING_FAILED);
      expect(result.warning!.failedImages).toEqual(['bad.jpg']);
      expect(result.warning!.message).toContain('1/2');

      // One image succeeded, one failed
      expect(prisma.itemImage.create).toHaveBeenCalledTimes(1);

      // Draft should be PARTIAL (not CONFIRMED)
      expect(prisma.aiItemDraft.update).toHaveBeenCalledWith({
        where: { id: 'draft-2' },
        data: { status: 'PARTIAL' },
      });

      // Item should be updated with notes
      expect(prisma.item.update).toHaveBeenCalledWith({
        where: { id: 'item-123' },
        data: { notes: expect.stringContaining('[INCOMPLETE]') },
      });

      // Logger should have been called with structured error
      expect(loggerErrorSpy).toHaveBeenCalled();
      expect(loggerErrorSpy.mock.calls.some(
        (call: unknown[]) => (call[0] as string).includes('1/2 failed image(s)'),
      )).toBe(true);
    });

    it('should create item normally when draft is not found', async () => {
      prisma.aiItemDraft.findUnique.mockResolvedValue(null);

      const result = await service.create({
        name: 'Test Item',
        draft_id: 'nonexistent-draft',
      });

      expect(result.item).toBeDefined();
      expect(result).not.toHaveProperty('warning');
      expect(storage.moveFile).not.toHaveBeenCalled();
      expect(prisma.item.update).not.toHaveBeenCalled();
    });

    it('should set draft status to FAILED when all images fail', async () => {
      const mockDraft = {
        id: 'draft-3',
        images_json: JSON.stringify([
          'http://localhost/uploads/drafts/fail1.jpg',
          'http://localhost/uploads/drafts/fail2.jpg',
        ]),
        status: 'PENDING',
      };

      prisma.aiItemDraft.findUnique.mockResolvedValue(mockDraft);
      storage.moveFile
        .mockRejectedValueOnce(new Error('Disk full'))
        .mockRejectedValueOnce(new Error('Permission denied'));

      const result = await service.create({
        name: 'Test Item',
        draft_id: 'draft-3',
      });

      expect(result.item).toBeDefined();

      // Should return warning
      expect(result.warning!.code).toBe(ErrorCode.DRAFT_IMAGE_PROCESSING_FAILED);
      expect(result.warning!.failedImages).toEqual(['fail1.jpg', 'fail2.jpg']);

      // No images should be created
      expect(prisma.itemImage.create).not.toHaveBeenCalled();

      // Draft should be FAILED (not CONFIRMED)
      expect(prisma.aiItemDraft.update).toHaveBeenCalledWith({
        where: { id: 'draft-3' },
        data: { status: 'FAILED' },
      });

      // Notes should reflect 2/2 failed
      expect(prisma.item.update).toHaveBeenCalledWith({
        where: { id: 'item-123' },
        data: { notes: expect.stringContaining('2/2') },
      });

      // Logger called for each failed image + summary
      expect(loggerErrorSpy).toHaveBeenCalled();
    });
  });

  // ============================================================
  // findAll
  // ============================================================
  describe('findAll', () => {
    const mockItemWithRelations = {
      ...mockItem,
      price: { toNumber: () => 100 },
      original_price: null,
      item_images: [{ file_path: 'images/cover.jpg' }],
      spin_sets: [],
      facebook_posts: [{ post_url: 'https://fb.com/post1', posted_at: new Date() }],
      _count: { facebook_posts: 1 },
    };

    it('should return paginated items with defaults', async () => {
      prisma.item.findMany.mockResolvedValue([mockItemWithRelations]);
      prisma.item.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.items).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        page_size: 20,
        total: 1,
        total_pages: 1,
      });
      expect(result.items[0].cover_image_url).toContain('cover.jpg');
      expect(result.items[0].fb_post_url).toBe('https://fb.com/post1');
    });

    it('should filter by status', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({ status: 'con_hang' as ItemStatus });

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.status).toBe('con_hang');
    });

    it('should filter by search query', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({ q: 'honda' });

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.name).toEqual({ contains: 'honda' });
    });

    it('should filter by fb_status=posted', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({ fb_status: 'posted' });

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.facebook_posts).toEqual({ some: {} });
    });

    it('should filter by fb_status=not_posted', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({ fb_status: 'not_posted' });

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.facebook_posts).toEqual({ none: {} });
    });

    it('should handle custom pagination', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(50);

      const result = await service.findAll({ page: 3, page_size: 10 });

      expect(result.pagination.page).toBe(3);
      expect(result.pagination.page_size).toBe(10);
      expect(result.pagination.total_pages).toBe(5);
      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.skip).toBe(20);
      expect(findManyCall.take).toBe(10);
    });
  });

  // ============================================================
  // findOne
  // ============================================================
  describe('findOne', () => {
    it('should return item with images and spin sets', async () => {
      const mockFullItem = {
        ...mockItem,
        price: { toNumber: () => 100 },
        original_price: null,
        item_images: [
          { id: 'img-1', item_id: 'item-123', file_path: 'images/1.jpg', thumbnail_path: 'thumbs/1.jpg', is_cover: true, display_order: 0, created_at: new Date() },
        ],
        spin_sets: [],
        facebook_posts: [],
      };

      prisma.item.findFirst.mockResolvedValue(mockFullItem);

      const result = await service.findOne('item-123');

      expect(result.item.id).toBe('item-123');
      expect(result.images).toHaveLength(1);
      expect(result.images[0].url).toContain('1.jpg');
    });

    it('should throw NOT_FOUND when item does not exist', async () => {
      prisma.item.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(AppException);
    });
  });

  // ============================================================
  // update
  // ============================================================
  describe('update', () => {
    it('should update item fields', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      prisma.item.update.mockResolvedValue({ ...mockItem, name: 'Updated Name' });

      const result = await service.update('item-123', { name: 'Updated Name' });

      expect(result.item.name).toBe('Updated Name');
      expect(prisma.item.update).toHaveBeenCalledWith({
        where: { id: 'item-123' },
        data: expect.objectContaining({ name: 'Updated Name' }),
      });
    });

    it('should throw NOT_FOUND when item does not exist', async () => {
      prisma.item.findFirst.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'x' })).rejects.toThrow(AppException);
    });

    it('should handle partial updates', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      prisma.item.update.mockResolvedValue({ ...mockItem, is_public: true });

      await service.update('item-123', { is_public: true });

      const updateCall = prisma.item.update.mock.calls[0][0];
      expect(updateCall.data.is_public).toBe(true);
      expect(updateCall.data.name).toBeUndefined();
    });
  });

  // ============================================================
  // remove
  // ============================================================
  describe('remove', () => {
    it('should soft-delete item', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      prisma.item.update.mockResolvedValue({ ...mockItem, deleted_at: new Date() });

      const result = await service.remove('item-123');

      expect(result).toEqual({});
      expect(prisma.item.update).toHaveBeenCalledWith({
        where: { id: 'item-123' },
        data: { deleted_at: expect.any(Date) },
      });
    });

    it('should throw NOT_FOUND when item does not exist', async () => {
      prisma.item.findFirst.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(AppException);
    });
  });

  // ============================================================
  // addFacebookPost
  // ============================================================
  describe('addFacebookPost', () => {
    it('should create a facebook post for item', async () => {
      prisma.item.findFirst.mockResolvedValue({
        ...mockItem,
        _count: { facebook_posts: 0 },
      });
      const mockPost = { id: 'post-1', item_id: 'item-123', post_url: 'https://fb.com/post1', content: null };
      prisma.facebookPost.create.mockResolvedValue(mockPost);

      const result = await service.addFacebookPost('item-123', {
        post_url: 'https://fb.com/post1',
      });

      expect(result.post.id).toBe('post-1');
    });

    it('should throw NOT_FOUND when item does not exist', async () => {
      prisma.item.findFirst.mockResolvedValue(null);

      await expect(
        service.addFacebookPost('nonexistent', { post_url: 'https://fb.com/post1' }),
      ).rejects.toThrow(AppException);
    });

    it('should throw when limit of 50 posts is reached', async () => {
      prisma.item.findFirst.mockResolvedValue({
        ...mockItem,
        _count: { facebook_posts: 50 },
      });

      await expect(
        service.addFacebookPost('item-123', { post_url: 'https://fb.com/post1' }),
      ).rejects.toThrow(AppException);
    });
  });

  // ============================================================
  // removeFacebookPost
  // ============================================================
  describe('removeFacebookPost', () => {
    it('should delete a facebook post', async () => {
      const mockPost = { id: 'post-1', item_id: 'item-123', post_url: 'https://fb.com/post1' };
      prisma.facebookPost.findFirst.mockResolvedValue(mockPost);
      prisma.facebookPost.delete.mockResolvedValue(mockPost);

      const result = await service.removeFacebookPost('item-123', 'post-1');

      expect(result).toEqual({});
    });

    it('should throw NOT_FOUND when post does not exist', async () => {
      prisma.facebookPost.findFirst.mockResolvedValue(null);

      await expect(
        service.removeFacebookPost('item-123', 'nonexistent'),
      ).rejects.toThrow(AppException);
    });
  });

  // ============================================================
  // exportCsv
  // ============================================================
  describe('exportCsv', () => {
    it('should return CSV with headers and BOM', async () => {
      prisma.item.findMany.mockResolvedValue([]);

      const result = await service.exportCsv();

      expect(result).toContain('\uFEFF'); // BOM
      expect(result).toContain('id,name,description,status');
    });

    it('should escape fields with commas and quotes', async () => {
      prisma.item.findMany.mockResolvedValue([
        {
          ...mockItem,
          name: 'Item "with quotes"',
          description: 'Has, commas',
          price: null,
          original_price: null,
          created_at: new Date('2025-01-01T00:00:00Z'),
          updated_at: new Date('2025-01-01T00:00:00Z'),
        },
      ]);

      const result = await service.exportCsv();

      expect(result).toContain('"Item ""with quotes"""');
      expect(result).toContain('"Has, commas"');
    });

    it('should handle Decimal values', async () => {
      prisma.item.findMany.mockResolvedValue([
        {
          ...mockItem,
          price: { toNumber: () => 99.99 },
          original_price: null,
          created_at: new Date('2025-01-01T00:00:00Z'),
          updated_at: new Date('2025-01-01T00:00:00Z'),
        },
      ]);

      const result = await service.exportCsv();

      expect(result).toContain('99.99');
    });
  });
});
