import { Test, TestingModule } from '@nestjs/testing';
import { ImagesService } from './images.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ImageProcessorService, WatermarkProcessingError } from '../image-processor/image-processor.service';
import { AppException } from '../common/exceptions/http-exception.filter';
import { UploadSupportService } from '../common/upload/upload-support.service';
import { Prisma } from '../generated/prisma/client';

describe('ImagesService', () => {
  let service: ImagesService;
  let prisma: {
    item: Record<string, jest.Mock>;
    itemImage: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };
  let imageProcessor: Record<string, jest.Mock>;
  let storage: Record<string, jest.Mock>;

  const mockItem = {
    id: 'item-1',
    name: 'Test Item',
    deleted_at: null,
  };

  const mockImage = {
    id: 'img-1',
    item_id: 'item-1',
    file_path: 'images/test.jpg',
    thumbnail_path: 'thumbnails/thumb_test.jpg',
    is_cover: true,
    display_order: 0,
    created_at: new Date(),
  };

  const mockFile = {
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP+H8hQ6wAAAABJRU5ErkJggg==',
      'base64',
    ),
    originalname: 'photo.png',
    mimetype: 'image/png',
    size: 1024,
    fieldname: 'file',
    encoding: '7bit',
  } as Express.Multer.File;

  beforeEach(async () => {
    prisma = {
      item: {
        findFirst: jest.fn(),
      },
      itemImage: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
    };

    imageProcessor = {
      processImage: jest.fn().mockResolvedValue(Buffer.from('processed')),
      generateThumbnail: jest.fn().mockResolvedValue(Buffer.from('thumbnail')),
      generateFilename: jest.fn().mockReturnValue('generated_name.jpg'),
      validateImage: jest.fn(),
    };

    storage = {
      saveFile: jest.fn().mockResolvedValue('images/generated_name.jpg'),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      getFileUrl: jest.fn((path: string) => `http://localhost/uploads/${path}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagesService,
        UploadSupportService,
        { provide: PrismaService, useValue: prisma },
        { provide: ImageProcessorService, useValue: imageProcessor },
        { provide: 'IStorageService', useValue: storage },
      ],
    }).compile();

    service = module.get<ImagesService>(ImagesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // uploadImage
  // ============================================================
  describe('uploadImage', () => {
    it('should upload and process image successfully', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      prisma.itemImage.count.mockResolvedValue(0);
      prisma.itemImage.findFirst.mockResolvedValue(null);
      prisma.itemImage.create.mockResolvedValue(mockImage);
      prisma.itemImage.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.uploadImage('item-1', mockFile);

      expect(imageProcessor.processImage).toHaveBeenCalledWith(mockFile.buffer, { watermark: true });
      expect(imageProcessor.generateThumbnail).toHaveBeenCalledWith(mockFile.buffer);
      expect(storage.saveFile).toHaveBeenCalledTimes(2); // image + thumbnail
      expect(result.image).toBeDefined();
      expect(result.image.id).toBe('img-1');
    });

    it('should throw NOT_FOUND when item does not exist', async () => {
      prisma.item.findFirst.mockResolvedValue(null);

      await expect(service.uploadImage('nonexistent', mockFile)).rejects.toThrow(AppException);
    });

    it('should scope item lookup by tenantId to prevent cross-tenant upload', async () => {
      prisma.item.findFirst.mockResolvedValue(null);

      await expect(service.uploadImage('item-1', mockFile, undefined, 'shop-a')).rejects.toThrow(
        AppException,
      );

      expect(prisma.item.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'item-1',
          deleted_at: null,
          shop_id: 'shop-a',
        },
      });
    });

    it('should set first image as cover by default', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      prisma.itemImage.count.mockResolvedValue(0);
      prisma.itemImage.create.mockResolvedValue(mockImage);
      prisma.itemImage.updateMany.mockResolvedValue({ count: 0 });

      await service.uploadImage('item-1', mockFile);

      const createCall = prisma.itemImage.create.mock.calls[0][0];
      expect(createCall.data.is_cover).toBe(true);
      expect(createCall.data.display_order).toBe(0);
      expect(prisma.itemImage.findFirst).not.toHaveBeenCalled();
    });

    it('should explicitly set cover when isCover=true', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      prisma.itemImage.count.mockResolvedValue(1);
      prisma.itemImage.findFirst.mockResolvedValue({ display_order: 2 }); // has existing cover
      prisma.itemImage.create.mockResolvedValue({ ...mockImage, display_order: 1 });
      prisma.itemImage.updateMany.mockResolvedValue({ count: 1 });

      await service.uploadImage('item-1', mockFile, true);

      // Should unset existing covers
      expect(prisma.itemImage.updateMany).toHaveBeenCalledWith({
        where: { item_id: 'item-1', is_cover: true },
        data: { is_cover: false },
      });
    });

    it('should translate WatermarkProcessingError into AppException', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      imageProcessor.processImage.mockRejectedValueOnce(new WatermarkProcessingError('no dims'));

      await expect(service.uploadImage('item-1', mockFile)).rejects.toThrow(AppException);
      expect(imageProcessor.generateThumbnail).not.toHaveBeenCalled();
    });

    it('should cleanup saved files when db transaction fails', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      prisma.itemImage.count.mockResolvedValue(0);

      // Make $transaction throw to simulate DB failure after file save
      prisma.$transaction.mockImplementationOnce(async () => {
        throw new Error('DB failure');
      });

      await expect(service.uploadImage('item-1', mockFile)).rejects.toThrow('DB failure');
      expect(storage.deleteFile).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================
  // updateImage
  // ============================================================
  describe('updateImage', () => {
    it('should update image properties', async () => {
      prisma.itemImage.findFirst.mockResolvedValue(mockImage);
      prisma.itemImage.update.mockResolvedValue({ ...mockImage, display_order: 5 });
      prisma.itemImage.findMany.mockResolvedValue([mockImage]);

      const result = await service.updateImage('item-1', 'img-1', { display_order: 5 });

      expect(result.image).toBeDefined();
    });

    it('should throw NOT_FOUND when image does not exist', async () => {
      prisma.itemImage.findFirst.mockResolvedValue(null);

      await expect(
        service.updateImage('item-1', 'nonexistent', { is_cover: true }),
      ).rejects.toThrow(AppException);
    });

    it('should unset other covers when setting is_cover=true', async () => {
      prisma.itemImage.findFirst.mockResolvedValue(mockImage);
      prisma.itemImage.update.mockResolvedValue({ ...mockImage, is_cover: true });
      prisma.itemImage.updateMany.mockResolvedValue({ count: 1 });
      prisma.itemImage.findMany.mockResolvedValue([mockImage]);

      await service.updateImage('item-1', 'img-1', { is_cover: true });

      expect(prisma.itemImage.updateMany).toHaveBeenCalledWith({
        where: { item_id: 'item-1', is_cover: true },
        data: { is_cover: false },
      });
    });
  });

  // ============================================================
  // reorderImages
  // ============================================================
  describe('reorderImages', () => {
    it('should reorder images by ids', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      prisma.itemImage.findMany.mockResolvedValue([
        { ...mockImage, id: 'img-1', display_order: 0, is_cover: true },
        { ...mockImage, id: 'img-2', display_order: 1, is_cover: false },
      ]);
      prisma.itemImage.updateMany.mockResolvedValue({ count: 1 });
      prisma.itemImage.update.mockResolvedValue({});

      const result = await service.reorderImages('item-1', {
        image_ids: ['img-2', 'img-1'],
      });

      expect(result.images).toHaveLength(2);
      // 4 calls for reindexing (negative + final), no cover-fix update when still exactly one cover
      expect(prisma.itemImage.update).toHaveBeenCalledTimes(4);
    });

    it('should throw if some image IDs do not belong to item', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      prisma.itemImage.findMany.mockResolvedValue([{ id: 'img-1' }]); // only 1 found

      await expect(service.reorderImages('item-1', { image_ids: ['img-1', 'img-wrong'] }))
        .rejects.toThrow('Reorder must include all item images');
    });

    it('should retry on transaction conflict then fail re-validation on latest snapshot mismatch', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      const retryable = new Prisma.PrismaClientKnownRequestError(
        'Transaction conflict',
        { code: 'P2034', clientVersion: 'test' },
      );

      let txAttempts = 0;
      prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        txAttempts += 1;
        const result = await fn(prisma);
        if (txAttempts === 1) {
          throw retryable;
        }
        return result;
      });

      prisma.itemImage.findMany
        .mockResolvedValueOnce([
          { ...mockImage, id: 'img-1', display_order: 0, is_cover: true },
          { ...mockImage, id: 'img-2', display_order: 1, is_cover: false },
        ])
        .mockResolvedValueOnce([
          { ...mockImage, id: 'img-1', display_order: 0, is_cover: true },
          { ...mockImage, id: 'img-2', display_order: 1, is_cover: false },
        ])
        .mockResolvedValueOnce([
          { ...mockImage, id: 'img-1', display_order: 0, is_cover: true },
          { ...mockImage, id: 'img-2', display_order: 1, is_cover: false },
          { ...mockImage, id: 'img-3', display_order: 2, is_cover: false },
        ]);
      prisma.itemImage.update.mockResolvedValue({});

      const delaySpy = jest
        .spyOn(service as unknown as { delayBeforeRetry: (attempt: number) => Promise<void> }, 'delayBeforeRetry')
        .mockResolvedValue(undefined);

      await expect(
        service.reorderImages('item-1', { image_ids: ['img-2', 'img-1'] }),
      ).rejects.toThrow('Reorder must include all item images');

      expect(txAttempts).toBe(2);
      expect(delaySpy).toHaveBeenCalledWith(0);
    });

    it('should throw when duplicate IDs are provided', async () => {
      await expect(
        service.reorderImages('item-1', { image_ids: ['img-1', 'img-1'] }),
      ).rejects.toThrow('Duplicate image IDs in reorder list');
    });
  });

  // ============================================================
  // deleteImage
  // ============================================================
  describe('deleteImage', () => {
    it('should delete image and its files', async () => {
      prisma.itemImage.findFirst.mockResolvedValue(mockImage);
      prisma.itemImage.delete.mockResolvedValue(mockImage);
      prisma.itemImage.findMany.mockResolvedValue([]);

      const result = await service.deleteImage('item-1', 'img-1');

      expect(result).toEqual({});
      expect(storage.deleteFile).toHaveBeenCalledWith('images/test.jpg');
      expect(storage.deleteFile).toHaveBeenCalledWith('thumbnails/thumb_test.jpg');
      expect(prisma.itemImage.delete).toHaveBeenCalledWith({ where: { id: 'img-1' } });
    });

    it('should throw NOT_FOUND when image does not exist', async () => {
      prisma.itemImage.findFirst.mockResolvedValue(null);

      await expect(service.deleteImage('item-1', 'nonexistent')).rejects.toThrow(AppException);
    });

    it('should reassign cover when cover image is deleted', async () => {
      prisma.itemImage.findFirst.mockResolvedValueOnce({ ...mockImage, is_cover: true });
      prisma.itemImage.delete.mockResolvedValue({});
      prisma.itemImage.update.mockResolvedValue({});
      prisma.itemImage.findMany.mockResolvedValue([
        {
          id: 'img-2',
          item_id: 'item-1',
          file_path: 'images/2.jpg',
          thumbnail_path: 'thumbnails/2.jpg',
          is_cover: false,
          display_order: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      await service.deleteImage('item-1', 'img-1');

      // Should set next image as cover
      expect(prisma.itemImage.update).toHaveBeenCalledWith({
        where: { id: 'img-2' },
        data: { is_cover: true },
      });
    });
  });

  // ============================================================
  // validateFile
  // ============================================================
  describe('validateFile (private, tested via uploadImage)', () => {
    it('should reject invalid MIME types', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);

      const invalidFile = { ...mockFile, mimetype: 'application/pdf' };

      await expect(
        service.uploadImage('item-1', invalidFile as Express.Multer.File),
      ).rejects.toThrow(AppException);
    });

    it('should reject files that are too large', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      const largeFile = { ...mockFile, size: 11 * 1024 * 1024 }; // exceeds default 10MB

      await expect(
        service.uploadImage('item-1', largeFile as Express.Multer.File),
      ).rejects.toThrow(AppException);
    });
  });

  // ============================================================
  // Business rule guards
  // ============================================================
  describe('updateImage business rules', () => {
    it('should throw when removing cover from the only image', async () => {
      prisma.itemImage.findFirst
        .mockResolvedValueOnce({ ...mockImage, is_cover: true })
        .mockResolvedValueOnce(null);
      prisma.itemImage.findMany.mockResolvedValue([]);

      await expect(
        service.updateImage('item-1', 'img-1', { is_cover: false }),
      ).rejects.toThrow('Item must always have one cover image');
    });
  });
  // ============================================================
  // Error resilience
  // ============================================================
  describe('deleteImage error handling', () => {
    it('should not fail request when storage.deleteFile fails during cleanup', async () => {
      prisma.itemImage.findFirst.mockResolvedValue(mockImage);
      prisma.itemImage.delete.mockResolvedValue(mockImage);
      prisma.itemImage.findMany.mockResolvedValue([]);
      storage.deleteFile.mockRejectedValueOnce(new Error('S3 unavailable'));

      await expect(service.deleteImage('item-1', 'img-1')).resolves.toEqual({});
    });
  });
});
