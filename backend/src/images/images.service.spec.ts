import { Test, TestingModule } from '@nestjs/testing';
import { ImagesService } from './images.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ImageProcessorService } from '../image-processor/image-processor.service';
import { AppException } from '../common/exceptions/http-exception.filter';

describe('ImagesService', () => {
  let service: ImagesService;
  let prisma: {
    item: Record<string, jest.Mock>;
    itemImage: Record<string, jest.Mock>;
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
    buffer: Buffer.from('test-image'),
    originalname: 'photo.jpg',
    mimetype: 'image/jpeg',
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
      },
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
      prisma.itemImage.findFirst.mockResolvedValue(null); // no existing images
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

    it('should set first image as cover by default', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      prisma.itemImage.findFirst.mockResolvedValue(null); // no existing → display_order = 0
      prisma.itemImage.create.mockResolvedValue(mockImage);
      prisma.itemImage.updateMany.mockResolvedValue({ count: 0 });

      await service.uploadImage('item-1', mockFile);

      const createCall = prisma.itemImage.create.mock.calls[0][0];
      expect(createCall.data.is_cover).toBe(true);
    });

    it('should explicitly set cover when isCover=true', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      prisma.itemImage.findFirst.mockResolvedValue({ display_order: 2 }); // has existing
      prisma.itemImage.create.mockResolvedValue({ ...mockImage, display_order: 3 });
      prisma.itemImage.updateMany.mockResolvedValue({ count: 1 });

      await service.uploadImage('item-1', mockFile, true);

      // Should unset existing covers
      expect(prisma.itemImage.updateMany).toHaveBeenCalledWith({
        where: { item_id: 'item-1', is_cover: true },
        data: { is_cover: false },
      });
    });
  });

  // ============================================================
  // updateImage
  // ============================================================
  describe('updateImage', () => {
    it('should update image properties', async () => {
      prisma.itemImage.findFirst.mockResolvedValue(mockImage);
      prisma.itemImage.update.mockResolvedValue({ ...mockImage, display_order: 5 });

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
      prisma.itemImage.findMany
        .mockResolvedValueOnce([
          { id: 'img-1' },
          { id: 'img-2' },
        ])
        .mockResolvedValueOnce([
          { ...mockImage, id: 'img-2', display_order: 0 },
          { ...mockImage, id: 'img-1', display_order: 1 },
        ]);
      prisma.itemImage.update.mockResolvedValue({});

      const result = await service.reorderImages('item-1', {
        image_ids: ['img-2', 'img-1'],
      });

      expect(result.images).toHaveLength(2);
      expect(prisma.itemImage.update).toHaveBeenCalledTimes(2);
    });

    it('should throw if some image IDs do not belong to item', async () => {
      prisma.itemImage.findMany.mockResolvedValue([{ id: 'img-1' }]); // only 1 found

      await expect(
        service.reorderImages('item-1', { image_ids: ['img-1', 'img-wrong'] }),
      ).rejects.toThrow(AppException);
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
      prisma.itemImage.findFirst
        .mockResolvedValueOnce({ ...mockImage, is_cover: true }) // the image to delete
        .mockResolvedValueOnce({ id: 'img-2', display_order: 1 }); // first remaining
      prisma.itemImage.delete.mockResolvedValue({});
      prisma.itemImage.update.mockResolvedValue({});
      prisma.itemImage.findMany.mockResolvedValue([]);

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
      process.env.MAX_UPLOAD_MB = '1';

      const largeFile = { ...mockFile, size: 2 * 1024 * 1024 }; // 2MB

      await expect(
        service.uploadImage('item-1', largeFile as Express.Multer.File),
      ).rejects.toThrow(AppException);

      delete process.env.MAX_UPLOAD_MB;
    });
  });
  // ============================================================
  // Error resilience
  // ============================================================
  describe('deleteImage error handling', () => {
    it('should propagate error when storage.deleteFile fails', async () => {
      prisma.itemImage.findFirst.mockResolvedValue(mockImage);
      storage.deleteFile.mockRejectedValueOnce(new Error('S3 unavailable'));

      await expect(
        service.deleteImage('item-1', 'img-1'),
      ).rejects.toThrow('S3 unavailable');
    });
  });
});
