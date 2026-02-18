import { Test, TestingModule } from '@nestjs/testing';
import { ItemsService } from './items.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { VectorStoreService } from '../ai/vector-store.service';
import { EmbeddingService } from '../ai/embedding.service';
import { ErrorCode } from '../common/constants/error-codes';

describe('ItemsService', () => {
  let service: ItemsService;
  let prisma: {
    item: Record<string, jest.Mock>;
    aiItemDraft: Record<string, jest.Mock>;
    itemImage: Record<string, jest.Mock>;
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
});
