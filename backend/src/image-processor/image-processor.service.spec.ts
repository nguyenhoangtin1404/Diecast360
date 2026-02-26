import { Test, TestingModule } from '@nestjs/testing';
import { ImageProcessorService } from './image-processor.service';
import * as sharp from 'sharp';

jest.mock('sharp');

describe('ImageProcessorService', () => {
  let service: ImageProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageProcessorService],
    }).compile();

    service = module.get<ImageProcessorService>(ImageProcessorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processImage', () => {
    it('should process image with default options', async () => {
      const buffer = Buffer.from('test');
      const mockSharp = {
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed')),
      };
      (sharp as unknown as jest.Mock).mockReturnValue(mockSharp);

      const result = await service.processImage(buffer);

      expect(sharp).toHaveBeenCalledWith(buffer);
      expect(mockSharp.resize).toHaveBeenCalledWith(1920, 1920, expect.any(Object));
      expect(result).toEqual(Buffer.from('processed'));
    });

    it('should apply watermark when option is true', async () => {
      const buffer = Buffer.from('test');
      const mockSharp = {
        resize: jest.fn().mockReturnThis(),
        metadata: jest.fn().mockResolvedValue({ width: 1000, height: 1000 }),
        composite: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('watermarked')),
      };
      (sharp as unknown as jest.Mock).mockReturnValue(mockSharp);

      const result = await service.processImage(buffer, { watermark: true });

      expect(mockSharp.metadata).toHaveBeenCalled();
      expect(mockSharp.composite).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            gravity: 'southeast',
          }),
        ]),
      );
      expect(result).toEqual(Buffer.from('watermarked'));
    });
  });

  describe('validateImage', () => {
    it('should return true for valid image', () => {
      (sharp as unknown as jest.Mock).mockReturnValue({});
      const result = service.validateImage(Buffer.from('valid'));
      expect(result).toBe(true);
    });

    it('should return false for invalid image', () => {
      (sharp as unknown as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid');
      });
      const result = service.validateImage(Buffer.from('invalid'));
      expect(result).toBe(false);
    });
  });

  describe('generateThumbnail', () => {
    it('should generate thumbnail with default size', async () => {
      const buffer = Buffer.from('test');
      const mockSharp = {
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('thumbnail')),
      };
      (sharp as unknown as jest.Mock).mockReturnValue(mockSharp);

      const result = await service.generateThumbnail(buffer);

      expect(mockSharp.resize).toHaveBeenCalledWith(300, 300, expect.any(Object));
      expect(result).toEqual(Buffer.from('thumbnail'));
    });

    it('should generate thumbnail with custom size', async () => {
      const buffer = Buffer.from('test');
      const mockSharp = {
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('thumbnail')),
      };
      (sharp as unknown as jest.Mock).mockReturnValue(mockSharp);

      await service.generateThumbnail(buffer, 150);

      expect(mockSharp.resize).toHaveBeenCalledWith(150, 150, expect.any(Object));
    });
  });

  describe('generateFilename', () => {
    it('should generate unique filename with original extension', () => {
      const filename = service.generateFilename('photo.png');
      expect(filename).toMatch(/^[0-9a-f-]+\.png$/);
    });

    it('should generate unique filename with .jpg default', () => {
      const filename = service.generateFilename();
      expect(filename).toMatch(/^[0-9a-f-]+\.jpg$/);
    });

    it('should generate different filenames on each call', () => {
      const f1 = service.generateFilename('test.jpg');
      const f2 = service.generateFilename('test.jpg');
      expect(f1).not.toEqual(f2);
    });
  });
});

