import { Test, TestingModule } from '@nestjs/testing';
import { ItemsService } from './items.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { VectorStoreService } from '../ai/vector-store.service';
import { EmbeddingService, EmbeddingUnavailableError } from '../ai/embedding.service';
import { ErrorCode } from '../common/constants/error-codes';
import { AppException } from '../common/exceptions/http-exception.filter';
import { ItemStatus } from '../generated/prisma/client';
import { FacebookGraphService } from '../integrations/facebook/facebook-graph.service';
import { FacebookConfigService } from '../integrations/facebook/facebook-config.service';


describe('ItemsService', () => {
  let service: ItemsService;
  let prisma: {
    item: Record<string, jest.Mock>;
    category: Record<string, jest.Mock>;
    aiItemDraft: Record<string, jest.Mock>;
    itemImage: Record<string, jest.Mock>;
    facebookPost: Record<string, jest.Mock>;
    vectorSyncTask: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };
  let storage: {
    moveFile: jest.Mock;
    getFileUrl: jest.Mock;
    saveFile: jest.Mock;
    deleteFile: jest.Mock;
  };
  let vectorStore: {
    upsertItem: jest.Mock;
    deleteItem: jest.Mock;
    search: jest.Mock;
  };
  let embeddingService: {
    getEmbedding: jest.Mock;
  };
  let loggerErrorSpy: jest.SpyInstance;
  let mockFacebookGraph: { publishPost: jest.Mock };
  let mockFbConfig: { isConfigured: jest.Mock };

  /** Active shop id for tenant-scoped service calls (matches UUID validation) */
  const TEST_SHOP_ID = '00000000-0000-0000-0000-000000000001';

  const mockItem = {
    id: 'item-123',
    shop_id: TEST_SHOP_ID,
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

    vectorStore = {
      upsertItem: jest.fn(),
      deleteItem: jest.fn(),
      search: jest.fn(),
    };

    embeddingService = {
      getEmbedding: jest.fn().mockResolvedValue([]),
    };

    prisma = {
      item: {
        create: jest.fn().mockResolvedValue(mockItem),
        update: jest.fn().mockResolvedValue(mockItem),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      category: {
        findFirst: jest.fn(),
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
      vectorSyncTask: {
        upsert: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (fn: (prisma: unknown) => Promise<unknown>) => fn(prisma)),
    };

    mockFacebookGraph = {
      publishPost: jest.fn().mockResolvedValue({
        postId: 'page_post123',
        postUrl: 'https://www.facebook.com/page_post123',
      }),
    };

    mockFbConfig = {
      // Default: Facebook IS configured. Individual tests that need to test
      // the unconfigured path override this value.
      isConfigured: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        { provide: PrismaService, useValue: prisma },
        { provide: 'IStorageService', useValue: storage },
        { provide: VectorStoreService, useValue: vectorStore },
        { provide: EmbeddingService, useValue: embeddingService },
        { provide: FacebookGraphService, useValue: mockFacebookGraph },
        { provide: FacebookConfigService, useValue: mockFbConfig },
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

  describe('tenant scope enforcement', () => {
    it('should reject findAll when active shop id is missing', async () => {
      await expect(service.findAll({}, '')).rejects.toMatchObject({
        errorCode: ErrorCode.AUTH_FORBIDDEN,
      });
    });

    it('should reject findOne when active shop id is missing', async () => {
      await expect(service.findOne('item-123', '')).rejects.toMatchObject({
        errorCode: ErrorCode.AUTH_FORBIDDEN,
      });
    });
  });

  describe('create', () => {
    it('should create item without draft', async () => {
      const result = await service.create({ name: 'Test Item' }, TEST_SHOP_ID);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.item.create).toHaveBeenCalled();
      expect(result.item).toBeDefined();
      expect(result.item.id).toBe('item-123');
      expect(result).not.toHaveProperty('warning');
    });

    it('should reject create when category metadata is invalid', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ name: 'Test Item', car_brand: 'Unknown Brand' }, TEST_SHOP_ID),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.ITEM_CATEGORY_INVALID,
      });
    });

    it('should reject create when original_price is lower than price', async () => {
      await expect(
        service.create({ name: 'Test Item', price: 200000, original_price: 150000 }, TEST_SHOP_ID),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.VALIDATION_ERROR,
      });
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

      const result = await service.create(
        {
          name: 'Test Item',
          draft_id: 'draft-1',
        },
        TEST_SHOP_ID,
      );

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

      const result = await service.create(
        {
          name: 'Test Item',
          draft_id: 'draft-2',
        },
        TEST_SHOP_ID,
      );

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

      const result = await service.create(
        {
          name: 'Test Item',
          draft_id: 'nonexistent-draft',
        },
        TEST_SHOP_ID,
      );

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

      const result = await service.create(
        {
          name: 'Test Item',
          draft_id: 'draft-3',
        },
        TEST_SHOP_ID,
      );

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

      const result = await service.findAll({}, TEST_SHOP_ID);

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

      await service.findAll({ status: 'con_hang' as ItemStatus }, TEST_SHOP_ID);

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.shop_id).toBe(TEST_SHOP_ID);
      expect(findManyCall.where.status).toBe('con_hang');
    });

    it('should filter by search query', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({ q: 'honda' }, TEST_SHOP_ID);

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.shop_id).toBe(TEST_SHOP_ID);
      expect(findManyCall.where.name).toEqual({ contains: 'honda', mode: 'insensitive' });
    });

    it('should keep soft-deleted items excluded by default', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({}, TEST_SHOP_ID);

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.shop_id).toBe(TEST_SHOP_ID);
      expect(findManyCall.where.deleted_at).toBeNull();
    });

    it('should filter by category metadata', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({ car_brand: 'Toyota', model_brand: 'Tomica' }, TEST_SHOP_ID);

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.shop_id).toBe(TEST_SHOP_ID);
      expect(findManyCall.where.car_brand).toBe('Toyota');
      expect(findManyCall.where.model_brand).toBe('Tomica');
    });

    it('should filter by fb_status=posted', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({ fb_status: 'posted' }, TEST_SHOP_ID);

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.shop_id).toBe(TEST_SHOP_ID);
      expect(findManyCall.where.facebook_posts).toEqual({ some: {} });
    });

    it('should filter by fb_status=not_posted', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(0);

      await service.findAll({ fb_status: 'not_posted' }, TEST_SHOP_ID);

      const findManyCall = prisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.shop_id).toBe(TEST_SHOP_ID);
      expect(findManyCall.where.facebook_posts).toEqual({ none: {} });
    });

    it('should handle custom pagination', async () => {
      prisma.item.findMany.mockResolvedValue([]);
      prisma.item.count.mockResolvedValue(50);

      const result = await service.findAll({ page: 3, page_size: 10 }, TEST_SHOP_ID);

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

      const result = await service.findOne('item-123', TEST_SHOP_ID);

      expect(result.item.id).toBe('item-123');
      expect(result.images).toHaveLength(1);
      expect(result.images[0].url).toContain('1.jpg');
    });

    it('should throw NOT_FOUND when item does not exist', async () => {
      prisma.item.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', TEST_SHOP_ID)).rejects.toThrow(AppException);
    });

    it('should not return an item that belongs to another shop (tenant isolation)', async () => {
      prisma.item.findFirst.mockResolvedValue(null);

      await expect(service.findOne('item-123', 'tenant-shop-a')).rejects.toThrow(AppException);

      expect(prisma.item.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'item-123',
            shop_id: 'tenant-shop-a',
            deleted_at: null,
          }),
        }),
      );
    });
  });

  // ============================================================
  // update
  // ============================================================
  describe('update', () => {
    it('should update item fields', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      prisma.item.update.mockResolvedValue({ ...mockItem, name: 'Updated Name' });

      const result = await service.update('item-123', { name: 'Updated Name' }, TEST_SHOP_ID);

      expect(result.item.name).toBe('Updated Name');
      expect(prisma.item.update).toHaveBeenCalledWith({
        where: { id: 'item-123' },
        data: expect.objectContaining({ name: 'Updated Name' }),
      });
    });

    it('should throw NOT_FOUND when item does not exist', async () => {
      prisma.item.findFirst.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'x' }, TEST_SHOP_ID)).rejects.toThrow(
        AppException,
      );
    });

    it('should handle partial updates', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      prisma.item.update.mockResolvedValue({ ...mockItem, is_public: true });

      await service.update('item-123', { is_public: true }, TEST_SHOP_ID);

      const updateCall = prisma.item.update.mock.calls[0][0];
      expect(updateCall.data.is_public).toBe(true);
      expect(updateCall.data.name).toBeUndefined();
    });

    it('should persist fb_post_content when provided', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      prisma.item.update.mockResolvedValue({ ...mockItem, fb_post_content: 'Post content from AI' });

      const result = await service.update(
        'item-123',
        { fb_post_content: 'Post content from AI' },
        TEST_SHOP_ID,
      );

      expect(prisma.item.update).toHaveBeenCalledWith({
        where: { id: 'item-123' },
        data: expect.objectContaining({
          fb_post_content: 'Post content from AI',
        }),
      });
      expect(result.item.fb_post_content).toBe('Post content from AI');
    });

    it('should allow unrelated updates without re-validating unchanged category metadata', async () => {
      prisma.item.findFirst.mockResolvedValue({
        ...mockItem,
        car_brand: 'Legacy Brand',
      });
      prisma.category.findFirst.mockResolvedValue(null);
      prisma.item.update.mockResolvedValue({ ...mockItem, is_public: true, car_brand: 'Legacy Brand' });

      const result = await service.update('item-123', { is_public: true }, TEST_SHOP_ID);

      expect(result.item.is_public).toBe(true);
      expect(prisma.category.findFirst).not.toHaveBeenCalled();
    });

    it('should reject invalid status transition from da_ban to con_hang', async () => {
      prisma.item.findFirst.mockResolvedValue({
        ...mockItem,
        status: 'da_ban',
      });

      await expect(
        service.update('item-123', { status: 'con_hang' }, TEST_SHOP_ID),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.ITEM_STATUS_TRANSITION_INVALID,
      });
    });
  });

  // ============================================================
  // remove
  // ============================================================
  describe('remove', () => {
    it('should soft-delete item', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      prisma.item.update.mockResolvedValue({ ...mockItem, deleted_at: new Date() });

      const result = await service.remove('item-123', TEST_SHOP_ID);

      expect(result).toEqual({});
      expect(prisma.item.update).toHaveBeenCalledWith({
        where: { id: 'item-123' },
        data: { deleted_at: expect.any(Date) },
      });
    });

    it('should throw NOT_FOUND when item does not exist', async () => {
      prisma.item.findFirst.mockResolvedValue(null);

      await expect(service.remove('nonexistent', TEST_SHOP_ID)).rejects.toThrow(AppException);
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

      const result = await service.addFacebookPost(
        'item-123',
        {
          post_url: 'https://fb.com/post1',
        },
        TEST_SHOP_ID,
      );

      expect(result.post.id).toBe('post-1');
    });

    it('should throw NOT_FOUND when item does not exist', async () => {
      prisma.item.findFirst.mockResolvedValue(null);

      await expect(
        service.addFacebookPost('nonexistent', { post_url: 'https://fb.com/post1' }, TEST_SHOP_ID),
      ).rejects.toThrow(AppException);
    });

    it('should persist optional post content when creating facebook post', async () => {
      prisma.item.findFirst.mockResolvedValue({
        ...mockItem,
        _count: { facebook_posts: 0 },
      });

      prisma.facebookPost.create.mockResolvedValue({
        id: 'post-2',
        item_id: 'item-123',
        post_url: 'https://fb.com/post2',
        content: 'Caption saved',
      });

      await service.addFacebookPost(
        'item-123',
        {
          post_url: 'https://fb.com/post2',
          content: 'Caption saved',
        },
        TEST_SHOP_ID,
      );

      expect(prisma.facebookPost.create).toHaveBeenCalledWith({
        data: {
          item_id: 'item-123',
          post_url: 'https://fb.com/post2',
          content: 'Caption saved',
        },
      });
    });

    it('should fallback to item fb_post_content when post content is omitted', async () => {
      prisma.item.findFirst.mockResolvedValue({
        ...mockItem,
        fb_post_content: 'Saved caption',
        _count: { facebook_posts: 0 },
      });

      prisma.facebookPost.create.mockResolvedValue({
        id: 'post-3',
        item_id: 'item-123',
        post_url: 'https://fb.com/post3',
        content: 'Saved caption',
      });

      await service.addFacebookPost(
        'item-123',
        {
          post_url: 'https://fb.com/post3',
        },
        TEST_SHOP_ID,
      );

      expect(prisma.facebookPost.create).toHaveBeenCalledWith({
        data: {
          item_id: 'item-123',
          post_url: 'https://fb.com/post3',
          content: 'Saved caption',
        },
      });
    });

    it('should throw when limit of 50 posts is reached', async () => {
      prisma.item.findFirst.mockResolvedValue({
        ...mockItem,
        _count: { facebook_posts: 50 },
      });

      await expect(
        service.addFacebookPost('item-123', { post_url: 'https://fb.com/post1' }, TEST_SHOP_ID),
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

      const result = await service.removeFacebookPost('item-123', 'post-1', TEST_SHOP_ID);

      expect(result).toEqual({});
      expect(prisma.facebookPost.findFirst).toHaveBeenCalledWith({
        where: { id: 'post-1', item_id: 'item-123', item: { shop_id: TEST_SHOP_ID } },
        include: { item: true },
      });
      expect(prisma.facebookPost.delete).toHaveBeenCalledWith({
        where: { id: 'post-1' },
      });
    });

    it('should throw NOT_FOUND when post does not exist', async () => {
      prisma.facebookPost.findFirst.mockResolvedValue(null);

      await expect(
        service.removeFacebookPost('item-123', 'nonexistent', TEST_SHOP_ID),
      ).rejects.toThrow(AppException);

      expect(prisma.facebookPost.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'nonexistent',
          item_id: 'item-123',
          item: { shop_id: TEST_SHOP_ID },
        },
        include: { item: true },
      });
    });
  });

  // ============================================================
  // publishFacebookPost
  // ============================================================
  describe('publishFacebookPost', () => {
    it('should publish to Facebook and persist post', async () => {
      mockFacebookGraph.publishPost.mockResolvedValue({
        postId: 'page_post123',
        postUrl: 'https://www.facebook.com/page_post123',
      });

      prisma.item.findFirst
        // First call: initial limit check
        .mockResolvedValueOnce({
          ...mockItem,
          fb_post_content: 'Saved caption',
          _count: { facebook_posts: 0 },
        })
        // Second call: re-check inside $transaction
        .mockResolvedValueOnce({
          ...mockItem,
          fb_post_content: 'Saved caption',
          _count: { facebook_posts: 0 },
        });

      const mockPost = {
        id: 'pub-post-1',
        item_id: 'item-123',
        post_url: 'https://www.facebook.com/page_post123',
        content: 'Custom content',
      };
      prisma.facebookPost.create.mockResolvedValue(mockPost);

      const result = await service.publishFacebookPost(
        'item-123',
        { content: 'Custom content' },
        TEST_SHOP_ID,
      );

      expect(result.post.id).toBe('pub-post-1');
      expect(mockFacebookGraph.publishPost).toHaveBeenCalledWith('Custom content');
      expect(prisma.facebookPost.create).toHaveBeenCalledWith({
        data: {
          item_id: 'item-123',
          post_url: 'https://www.facebook.com/page_post123',
          content: 'Custom content',
        },
      });
    });

    it('should fallback to item.fb_post_content when content is omitted', async () => {
      mockFacebookGraph.publishPost.mockResolvedValue({
        postId: 'page_post456',
        postUrl: 'https://www.facebook.com/page_post456',
      });

      prisma.item.findFirst
        .mockResolvedValueOnce({
          ...mockItem,
          fb_post_content: 'Fallback caption',
          _count: { facebook_posts: 0 },
        })
        .mockResolvedValueOnce({
          ...mockItem,
          fb_post_content: 'Fallback caption',
          _count: { facebook_posts: 0 },
        });

      prisma.facebookPost.create.mockResolvedValue({
        id: 'pub-post-2',
        item_id: 'item-123',
        post_url: 'https://www.facebook.com/page_post456',
        content: 'Fallback caption',
      });

      await service.publishFacebookPost('item-123', {}, TEST_SHOP_ID);

      expect(mockFacebookGraph.publishPost).toHaveBeenCalledWith('Fallback caption');
    });

    it('should throw NOT_FOUND when item does not exist', async () => {
      prisma.item.findFirst.mockResolvedValue(null);

      await expect(
        service.publishFacebookPost('nonexistent', undefined, TEST_SHOP_ID),
      ).rejects.toThrow(AppException);
    });

    it('should throw VALIDATION_ERROR when no content available', async () => {
      prisma.item.findFirst.mockResolvedValue({
        ...mockItem,
        fb_post_content: null,
        _count: { facebook_posts: 0 },
      });

      await expect(
        service.publishFacebookPost('item-123', undefined, TEST_SHOP_ID),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.VALIDATION_ERROR,
      });
    });

    it('should throw INTERNAL_SERVER_ERROR when Facebook is not configured', async () => {
      mockFbConfig.isConfigured.mockReturnValueOnce(false);

      await expect(
        service.publishFacebookPost('item-123', { content: 'Test' }, TEST_SHOP_ID),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      });

      // Should not touch the DB or Graph API when unconfigured
      expect(prisma.item.findFirst).not.toHaveBeenCalled();
      expect(mockFacebookGraph.publishPost).not.toHaveBeenCalled();
    });

    it('should throw when post limit of 50 is reached', async () => {
      prisma.item.findFirst.mockResolvedValue({
        ...mockItem,
        fb_post_content: 'Some content',
        _count: { facebook_posts: 50 },
      });

      await expect(
        service.publishFacebookPost('item-123', { content: 'Test' }, TEST_SHOP_ID),
      ).rejects.toThrow(AppException);
    });

    it('should throw FACEBOOK_PUBLISH_ERROR and warn when Graph API published but DB create fails', async () => {
      mockFacebookGraph.publishPost.mockResolvedValue({
        postId: 'page_postXYZ',
        postUrl: 'https://www.facebook.com/page_postXYZ',
      });

      prisma.item.findFirst
        .mockResolvedValueOnce({
          ...mockItem,
          fb_post_content: 'DB fail test',
          _count: { facebook_posts: 0 },
        })
        .mockResolvedValueOnce({
          ...mockItem,
          fb_post_content: 'DB fail test',
          _count: { facebook_posts: 0 },
        });
      prisma.facebookPost.create.mockRejectedValue(new Error('DB connection lost'));

      await expect(
        service.publishFacebookPost('item-123', { content: 'DB fail test' }, TEST_SHOP_ID),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.FACEBOOK_PUBLISH_ERROR,
      });

      // Graph API must have been called even though DB failed
      expect(mockFacebookGraph.publishPost).toHaveBeenCalledWith('DB fail test');
    });

    it('should throw VALIDATION_ERROR (not publish to FB) when re-check inside transaction detects limit reached', async () => {
      // Simulates the TOCTOU race condition scenario:
      // - Initial check sees count=49 (passes)
      // - Graph API is called and succeeds
      // - Re-check inside transaction sees count=50 (concurrent request got there first)
      // Expected: throws VALIDATION_ERROR, does NOT persist a phantom post record
      mockFacebookGraph.publishPost.mockResolvedValue({
        postId: 'page_postRace',
        postUrl: 'https://www.facebook.com/page_postRace',
      });

      prisma.item.findFirst
        // Initial count check: 49 posts (passes the first guard)
        .mockResolvedValueOnce({
          ...mockItem,
          fb_post_content: 'Race caption',
          _count: { facebook_posts: 49 },
        })
        // Re-check inside $transaction: 50 posts (concurrent request won the race)
        .mockResolvedValueOnce({
          ...mockItem,
          fb_post_content: 'Race caption',
          _count: { facebook_posts: 50 },
        });

      await expect(
        service.publishFacebookPost('item-123', { content: 'Race caption' }, TEST_SHOP_ID),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.VALIDATION_ERROR,
      });

      // The Graph API was called (side effect already happened — this is the
      // known limitation of the approach; the post exists on FB but not in DB).
      expect(mockFacebookGraph.publishPost).toHaveBeenCalledWith('Race caption');
      // But the DB record was NOT created
      expect(prisma.facebookPost.create).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // syncVectorStore & queue
  // ============================================================
  describe('syncVectorStore', () => {
    const vectorItem = {
      id: 'item-xyz',
      name: 'Vector Item',
      description: 'Sync me',
      brand: null,
      car_brand: null,
      scale: '1:64',
      condition: null,
      is_public: true,
      deleted_at: null,
    };

    it('should enqueue retry when embeddings are unavailable', async () => {
      embeddingService.getEmbedding.mockRejectedValueOnce(new EmbeddingUnavailableError('missing key'));

      await service.syncVectorStore(vectorItem);

      expect(prisma.vectorSyncTask.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { item_id: vectorItem.id } }),
      );
    });

    it('should clear retry task after successful sync', async () => {
      embeddingService.getEmbedding.mockResolvedValueOnce([0.1, 0.2]);

      await service.syncVectorStore(vectorItem);

      expect(vectorStore.upsertItem).toHaveBeenCalled();
      expect(prisma.vectorSyncTask.deleteMany).toHaveBeenCalledWith({
        where: { item_id: vectorItem.id },
      });
    });

    it('should process pending tasks from queue', async () => {
      const syncSpy = jest.spyOn(service, 'syncVectorStore').mockResolvedValue(undefined);
      prisma.vectorSyncTask.findMany.mockResolvedValue([
        { item_id: vectorItem.id, item: vectorItem } as unknown as { item_id: string; item: typeof vectorItem },
      ]);

      const result = await service.processVectorSyncQueue();

      expect(syncSpy).toHaveBeenCalledWith(vectorItem);
      expect(result.processed).toBe(1);
      syncSpy.mockRestore();
    });

    it('should clean up tasks without backing items', async () => {
      prisma.vectorSyncTask.deleteMany.mockClear();
      prisma.vectorSyncTask.findMany.mockResolvedValue([
        { item_id: 'missing-item', item: null } as unknown as { item_id: string; item: typeof vectorItem | null },
      ]);

      await service.processVectorSyncQueue();

      expect(prisma.vectorSyncTask.deleteMany).toHaveBeenCalledWith({
        where: { item_id: 'missing-item' },
      });
    });

    it('should re-enqueue when syncVectorStore throws unexpectedly', async () => {
      const syncSpy = jest.spyOn(service, 'syncVectorStore').mockRejectedValue(new Error('vector failure'));
      prisma.vectorSyncTask.upsert.mockClear();
      prisma.vectorSyncTask.findMany.mockResolvedValue([
        { item_id: vectorItem.id, item: vectorItem } as unknown as { item_id: string; item: typeof vectorItem },
      ]);

      await service.processVectorSyncQueue();

      expect(prisma.vectorSyncTask.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { item_id: vectorItem.id } }),
      );
      syncSpy.mockRestore();
    });
  });

  // ============================================================
  // exportCsv
  // ============================================================
  describe('exportCsv', () => {
    it('should return CSV with headers and BOM', async () => {
      prisma.item.findMany.mockResolvedValue([]);

      const result = await service.exportCsv(TEST_SHOP_ID);

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

      const result = await service.exportCsv(TEST_SHOP_ID);

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

      const result = await service.exportCsv(TEST_SHOP_ID);

      expect(result).toContain('99.99');
    });
  });
});

