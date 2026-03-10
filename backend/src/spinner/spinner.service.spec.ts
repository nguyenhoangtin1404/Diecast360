import { Test, TestingModule } from '@nestjs/testing';
import { SpinnerService } from './spinner.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ImageProcessorService, WatermarkProcessingError } from '../image-processor/image-processor.service';
import { AppException } from '../common/exceptions/http-exception.filter';
import { UploadSupportService } from '../common/upload/upload-support.service';
import { Prisma } from '../generated/prisma/client';

describe('SpinnerService', () => {
  let service: SpinnerService;
  let prisma: {
    item: Record<string, jest.Mock>;
    spinSet: Record<string, jest.Mock>;
    spinFrame: Record<string, jest.Mock>;
    $executeRaw: jest.Mock;
    $transaction: jest.Mock;
  };
  let imageProcessor: Record<string, jest.Mock>;
  let storage: Record<string, jest.Mock>;

  const mockSpinSet = {
    id: 'spin-1',
    item_id: 'item-1',
    label: 'Default',
    is_default: true,
    created_at: new Date(),
    updated_at: new Date(),
    frames: [],
  };

  const mockFrame = {
    id: 'frame-1',
    spin_set_id: 'spin-1',
    frame_index: 0,
    file_path: 'spinner/frame0.jpg',
    thumbnail_path: 'spinner/thumbnails/thumb_frame0.jpg',
    created_at: new Date(),
  };

  const mockFile = {
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP+H8hQ6wAAAABJRU5ErkJggg==',
      'base64',
    ),
    originalname: 'frame.png',
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
      spinSet: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      spinFrame: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        updateMany: jest.fn(),
      },
      $executeRaw: jest.fn().mockResolvedValue(1),
      $transaction: jest.fn(async (fn: (prisma: unknown) => Promise<unknown>) => fn(prisma)),
    };

    imageProcessor = {
      processImage: jest.fn().mockResolvedValue(Buffer.from('processed')),
      generateThumbnail: jest.fn().mockResolvedValue(Buffer.from('thumb')),
      generateFilename: jest.fn().mockReturnValue('generated.jpg'),
    };

    storage = {
      saveFile: jest.fn().mockResolvedValue('spinner/generated.jpg'),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      getFileUrl: jest.fn((path: string) => `http://localhost/uploads/${path}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpinnerService,
        UploadSupportService,
        { provide: PrismaService, useValue: prisma },
        { provide: ImageProcessorService, useValue: imageProcessor },
        { provide: 'IStorageService', useValue: storage },
      ],
    }).compile();

    service = module.get<SpinnerService>(SpinnerService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // getSpinSets
  // ============================================================
  describe('getSpinSets', () => {
    it('should return spin sets with mapped frames', async () => {
      prisma.spinSet.findMany.mockResolvedValue([
        { ...mockSpinSet, frames: [mockFrame] },
      ]);

      const result = await service.getSpinSets('item-1');

      expect(result.spin_sets).toHaveLength(1);
      expect(result.spin_sets[0].frames).toHaveLength(1);
      expect(result.spin_sets[0].frames[0].image_url).toContain('frame0.jpg');
    });

    it('should return empty array if no spin sets', async () => {
      prisma.spinSet.findMany.mockResolvedValue([]);

      const result = await service.getSpinSets('item-1');

      expect(result.spin_sets).toHaveLength(0);
    });
  });

  // ============================================================
  // createSpinSet
  // ============================================================
  describe('createSpinSet', () => {
    it('should create a spin set', async () => {
      prisma.item.findFirst.mockResolvedValue({ id: 'item-1' });
      prisma.spinSet.create.mockResolvedValue(mockSpinSet);

      const result = await service.createSpinSet('item-1', {
        label: 'Default',
        is_default: false,
      });

      expect(result.spin_set.id).toBe('spin-1');
      expect(result.spin_set.frames).toEqual([]);
    });

    it('should throw NOT_FOUND when item does not exist', async () => {
      prisma.item.findFirst.mockResolvedValue(null);

      await expect(
        service.createSpinSet('nonexistent', { label: 'Test' }),
      ).rejects.toThrow(AppException);
    });

    it('should unset other defaults when creating default spin set', async () => {
      prisma.item.findFirst.mockResolvedValue({ id: 'item-1' });
      prisma.spinSet.updateMany.mockResolvedValue({ count: 1 });
      prisma.spinSet.create.mockResolvedValue({ ...mockSpinSet, is_default: true });

      await service.createSpinSet('item-1', { label: 'New Default', is_default: true });

      expect(prisma.spinSet.updateMany).toHaveBeenCalledWith({
        where: { item_id: 'item-1', is_default: true },
        data: { is_default: false },
      });
    });
  });

  // ============================================================
  // updateSpinSet
  // ============================================================
  describe('updateSpinSet', () => {
    it('should update spin set properties', async () => {
      prisma.spinSet.findUnique.mockResolvedValue({ ...mockSpinSet, item: { id: 'item-1' } });
      prisma.spinSet.update.mockResolvedValue({ ...mockSpinSet, label: 'Updated', frames: [] });

      const result = await service.updateSpinSet('spin-1', { label: 'Updated' });

      expect(result.spin_set.label).toBe('Updated');
    });

    it('should throw NOT_FOUND when spin set does not exist', async () => {
      prisma.spinSet.findUnique.mockResolvedValue(null);

      await expect(
        service.updateSpinSet('nonexistent', { label: 'x' }),
      ).rejects.toThrow(AppException);
    });

    it('should unset other defaults when setting is_default=true', async () => {
      prisma.spinSet.findUnique.mockResolvedValue({
        ...mockSpinSet,
        item_id: 'item-1',
        item: { id: 'item-1' },
      });
      prisma.spinSet.updateMany.mockResolvedValue({ count: 1 });
      prisma.spinSet.update.mockResolvedValue({ ...mockSpinSet, is_default: true, frames: [] });

      await service.updateSpinSet('spin-1', { is_default: true });

      expect(prisma.spinSet.updateMany).toHaveBeenCalledWith({
        where: {
          item_id: 'item-1',
          id: { not: 'spin-1' },
          is_default: true,
        },
        data: { is_default: false },
      });
    });
  });

  // ============================================================
  // uploadFrame
  // ============================================================
  describe('uploadFrame', () => {
    it('should upload frame and auto-assign frame_index', async () => {
      prisma.spinSet.findUnique.mockResolvedValue(mockSpinSet);
      prisma.spinFrame.count.mockResolvedValue(2);
      prisma.spinFrame.create.mockResolvedValue({ ...mockFrame, frame_index: 2 });

      const result = await service.uploadFrame('spin-1', mockFile, {});

      expect(result.frame.frame_index).toBe(2);
      expect(prisma.spinFrame.updateMany).not.toHaveBeenCalled();
      expect(imageProcessor.processImage).toHaveBeenCalled();
      expect(storage.saveFile).toHaveBeenCalledTimes(2);
      expect(prisma.spinFrame.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          spin_set_id: 'spin-1',
          frame_index: 2,
        }),
      });
    });

    it('should throw NOT_FOUND when spin set does not exist', async () => {
      prisma.spinSet.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadFrame('nonexistent', mockFile, {}),
      ).rejects.toThrow(AppException);
    });

    it('should insert frame at requested index and shift existing frames', async () => {
      prisma.spinSet.findUnique.mockResolvedValue(mockSpinSet);
      prisma.spinFrame.count.mockResolvedValue(3);
      prisma.spinFrame.create.mockResolvedValue({ ...mockFrame, frame_index: 1 });

      const result = await service.uploadFrame('spin-1', mockFile, { frame_index: 1 });

      expect(result.frame.frame_index).toBe(1);
      expect(prisma.spinFrame.updateMany).toHaveBeenCalledWith({
        where: { spin_set_id: 'spin-1', frame_index: { gte: 1 } },
        data: { frame_index: { increment: 1 } },
      });
      expect(prisma.spinFrame.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ spin_set_id: 'spin-1', frame_index: 1 }),
      });
    });

    it('should clamp requested frame_index to frameCount when index is too large', async () => {
      prisma.spinSet.findUnique.mockResolvedValue(mockSpinSet);
      prisma.spinFrame.count.mockResolvedValue(3);
      prisma.spinFrame.create.mockResolvedValue({ ...mockFrame, frame_index: 3 });

      const result = await service.uploadFrame('spin-1', mockFile, { frame_index: 100 });

      expect(result.frame.frame_index).toBe(3);
      expect(prisma.spinFrame.updateMany).toHaveBeenCalledWith({
        where: { spin_set_id: 'spin-1', frame_index: { gte: 3 } },
        data: { frame_index: { increment: 1 } },
      });
      expect(prisma.spinFrame.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ spin_set_id: 'spin-1', frame_index: 3 }),
      });
    });

    it('should reject negative frame_index', async () => {
      prisma.spinSet.findUnique.mockResolvedValue(mockSpinSet);
      prisma.spinFrame.count.mockResolvedValue(1);

      await expect(
        service.uploadFrame('spin-1', mockFile, { frame_index: -1 }),
      ).rejects.toThrow(AppException);
    });
    it('should reject uploads beyond max frame limit', async () => {
      prisma.spinSet.findUnique.mockResolvedValue(mockSpinSet);
      prisma.spinFrame.count.mockResolvedValue(48); // max frames reached

      await expect(
        service.uploadFrame('spin-1', mockFile, {}),
      ).rejects.toThrow(AppException);
      expect(storage.saveFile).not.toHaveBeenCalled();
    });
    it('should convert WatermarkProcessingError to AppException', async () => {
      prisma.spinSet.findUnique.mockResolvedValue(mockSpinSet);
      imageProcessor.processImage.mockRejectedValueOnce(new WatermarkProcessingError('fail watermark'));

      await expect(service.uploadFrame('spin-1', mockFile, {})).rejects.toThrow(AppException);
      expect(storage.saveFile).not.toHaveBeenCalled();
    });

    it('should cleanup saved files when db transaction fails', async () => {
      prisma.spinSet.findUnique.mockResolvedValue(mockSpinSet);
      prisma.spinFrame.count.mockResolvedValue(0);
      prisma.$transaction.mockImplementationOnce(async () => {
        throw new Error('DB failure');
      });

      await expect(service.uploadFrame('spin-1', mockFile, {})).rejects.toThrow('DB failure');
      expect(storage.deleteFile).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================
  // deleteFrame
  // ============================================================
  describe('deleteFrame', () => {
    it('should delete frame and its files', async () => {
      prisma.spinFrame.findFirst.mockResolvedValue(mockFrame);
      prisma.spinFrame.delete.mockResolvedValue(mockFrame);
      prisma.spinFrame.findMany.mockResolvedValue([]);

      const result = await service.deleteFrame('spin-1', 'frame-1');

      expect(result).toEqual({});
      expect(storage.deleteFile).toHaveBeenCalledWith('spinner/frame0.jpg');
      expect(storage.deleteFile).toHaveBeenCalledWith('spinner/thumbnails/thumb_frame0.jpg');
    });

    it('should reindex remaining frames using 2-phase raw updates', async () => {
      prisma.spinFrame.findFirst.mockResolvedValue(mockFrame);
      prisma.spinFrame.delete.mockResolvedValue(mockFrame);
      prisma.spinFrame.findMany.mockResolvedValue([
        { ...mockFrame, id: 'f-2', frame_index: 1 },
        { ...mockFrame, id: 'f-3', frame_index: 2 },
      ]);

      await service.deleteFrame('spin-1', 'frame-1');

      expect(prisma.$executeRaw).toHaveBeenCalledTimes(2);
      expect(prisma.spinFrame.update).not.toHaveBeenCalled();

      const firstSql = prisma.$executeRaw.mock.calls[0][0] as { strings?: string[] };
      const secondSql = prisma.$executeRaw.mock.calls[1][0] as { strings?: string[] };

      expect(firstSql.strings?.join('')).toContain('SET "frame_index" = -("frame_index" + 1)');
      expect(secondSql.strings?.join('')).toContain('FROM (VALUES');
    });

    it('should avoid legacy per-row unique conflicts by not calling spinFrame.update during delete reorder', async () => {
      prisma.spinFrame.findFirst.mockResolvedValue(mockFrame);
      prisma.spinFrame.delete.mockResolvedValue(mockFrame);
      prisma.spinFrame.findMany.mockResolvedValue([
        { ...mockFrame, id: 'f-2', frame_index: 1 },
        { ...mockFrame, id: 'f-3', frame_index: 0 },
      ]);

      // If implementation regresses to per-row updates, this would fail with P2002 on index swap.
      prisma.spinFrame.update.mockImplementation(() => {
        throw new Prisma.PrismaClientKnownRequestError('Unique conflict', {
          code: 'P2002',
          clientVersion: 'test',
        });
      });

      await expect(service.deleteFrame('spin-1', 'frame-1')).resolves.toEqual({});
      expect(prisma.spinFrame.update).not.toHaveBeenCalled();
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(2);
    });

    it('should throw NOT_FOUND when frame does not exist', async () => {
      prisma.spinFrame.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteFrame('spin-1', 'nonexistent'),
      ).rejects.toThrow(AppException);
    });
  });

  // ============================================================
  // reorderFrames
  // ============================================================
  describe('reorderFrames', () => {
    it('should reorder frames successfully via 2-step transaction', async () => {
      const frame1 = { ...mockFrame, id: 'f-1', frame_index: 0 };
      const frame2 = { ...mockFrame, id: 'f-2', frame_index: 1 };

      prisma.spinSet.findUnique.mockResolvedValue(mockSpinSet);
      prisma.spinFrame.findMany
        .mockResolvedValueOnce([frame1, frame2])  // all frames in transaction
        .mockResolvedValueOnce([                  // final result after reorder
          { ...frame2, frame_index: 0 },
          { ...frame1, frame_index: 1 },
        ]);

      const result = await service.reorderFrames('spin-1', {
        frame_ids: ['f-2', 'f-1'],
      });

      expect(result.frames).toHaveLength(2);
      // 2-step update via raw SQL: temporary negatives then final indices
      expect(prisma.$executeRaw).toHaveBeenCalledTimes(2);
    });

    it('should throw NOT_FOUND when spin set does not exist', async () => {
      prisma.spinSet.findUnique.mockResolvedValue(null);

      await expect(
        service.reorderFrames('nonexistent', { frame_ids: ['f-1'] }),
      ).rejects.toThrow(AppException);
    });

    it('should throw if some frame IDs are invalid', async () => {
      prisma.spinSet.findUnique.mockResolvedValue(mockSpinSet);
      prisma.spinFrame.findMany.mockResolvedValue([{ id: 'f-1' }]); // only 1 found

      await expect(
        service.reorderFrames('spin-1', { frame_ids: ['f-1', 'f-wrong'] }),
      ).rejects.toThrow(AppException);
    });

    it('should throw if duplicate frame IDs are provided', async () => {
      const frame1 = { ...mockFrame, id: 'f-1', frame_index: 0 };
      prisma.spinSet.findUnique.mockResolvedValue(mockSpinSet);
      prisma.spinFrame.findMany
        .mockResolvedValueOnce([frame1])  // validate
        .mockResolvedValueOnce([frame1]); // all frames

      await expect(
        service.reorderFrames('spin-1', { frame_ids: ['f-1', 'f-1'] }),
      ).rejects.toThrow(AppException);
    });
  });

  // ============================================================
  // validateFile (tested via uploadFrame)
  // ============================================================
  describe('validateFile (via uploadFrame)', () => {
    it('should reject invalid MIME type', async () => {
      prisma.spinSet.findUnique.mockResolvedValue(mockSpinSet);

      const invalidFile = { ...mockFile, mimetype: 'application/pdf' };

      await expect(
        service.uploadFrame('spin-1', invalidFile as Express.Multer.File, {}),
      ).rejects.toThrow(AppException);
    });
  });

  // ============================================================
  // Error resilience
  // ============================================================
  describe('deleteFrame error handling', () => {
    it('should not fail request when storage.deleteFile fails during cleanup', async () => {
      prisma.spinFrame.findFirst.mockResolvedValue(mockFrame);
      prisma.spinFrame.delete.mockResolvedValue(mockFrame);
      prisma.spinFrame.findMany.mockResolvedValue([]);
      storage.deleteFile.mockRejectedValueOnce(new Error('Disk error'));

      await expect(service.deleteFrame('spin-1', 'frame-1')).resolves.toEqual({});
    });
  });
});
