import { Test, TestingModule } from '@nestjs/testing';
import { ItemsService } from './items.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { VectorStoreService } from '../ai/vector-store.service';
import { EmbeddingService } from '../ai/embedding.service';

describe('ItemsService', () => {
  let service: ItemsService;
  let prisma: any;
  let storage: any;

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
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
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
      expect(storage.moveFile).toHaveBeenCalledTimes(2);
      expect(prisma.itemImage.create).toHaveBeenCalledTimes(2);
      expect(prisma.aiItemDraft.update).toHaveBeenCalledWith({
        where: { id: 'draft-1' },
        data: { status: 'CONFIRMED' },
      });
      // No notes should be set (item.update for notes should NOT be called)
      expect(prisma.item.update).not.toHaveBeenCalled();
    });

    it('should mark item with notes when some images fail to process', async () => {
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
      // One image succeeded, one failed
      expect(prisma.itemImage.create).toHaveBeenCalledTimes(1);
      // Item should be updated with notes
      expect(prisma.item.update).toHaveBeenCalledWith({
        where: { id: 'item-123' },
        data: {
          notes: expect.stringContaining('[INCOMPLETE]'),
        },
      });
      expect(prisma.item.update).toHaveBeenCalledWith({
        where: { id: 'item-123' },
        data: {
          notes: expect.stringContaining('bad.jpg'),
        },
      });
    });

    it('should create item normally when draft is not found', async () => {
      prisma.aiItemDraft.findUnique.mockResolvedValue(null);

      const result = await service.create({
        name: 'Test Item',
        draft_id: 'nonexistent-draft',
      });

      expect(result.item).toBeDefined();
      expect(storage.moveFile).not.toHaveBeenCalled();
      expect(prisma.item.update).not.toHaveBeenCalled();
    });

    it('should mark item with notes when all images fail', async () => {
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
      expect(prisma.itemImage.create).not.toHaveBeenCalled();
      expect(prisma.item.update).toHaveBeenCalledWith({
        where: { id: 'item-123' },
        data: {
          notes: expect.stringContaining('Failed to process 2 draft image(s)'),
        },
      });
    });
  });
});
