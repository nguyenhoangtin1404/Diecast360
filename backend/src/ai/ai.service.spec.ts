import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import OpenAI from 'openai';

// Mock OpenAI module
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

describe('AiService', () => {
  let service: AiService;
  let configGet: jest.Mock;
  let prisma: {
    item: Record<string, jest.Mock>;
    itemImage: Record<string, jest.Mock>;
  };

  const mockItem = {
    id: 'item-1',
    name: 'Hot Wheels Civic',
    description: 'A diecast car',
    scale: '1:64',
    brand: 'Hot Wheels',
    car_brand: 'Honda',
    model_brand: null,
    condition: 'new',
    price: { toNumber: () => 100 },
    original_price: null,
    status: 'con_hang',
    is_public: true,
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    fb_post_content: null,
  };

  const descriptionResponse = {
    short_description: 'Mô tả ngắn cho sản phẩm',
    long_description: 'Mô tả chi tiết cho sản phẩm diecast',
    bullet_specs: ['Spec 1', 'Spec 2', 'Spec 3'],
    meta_title: 'SEO Title',
    meta_description: 'SEO meta description',
  };

  beforeEach(async () => {
    prisma = {
      item: {
        findFirst: jest.fn(),
      },
      itemImage: {
        findMany: jest.fn(),
      },
    };

    configGet = jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'test-api-key';
      if (key === 'OPENAI_MODEL') return 'gpt-4';
      return null;
    });

    // Reset the default mock response
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(descriptionResponse),
          },
        },
      ],
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: { get: configGet },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // generateItemDescription
  // ============================================================
  describe('generateItemDescription', () => {
    it('should generate description and return full DTO', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);

      const result = await service.generateItemDescription('item-1');

      expect(result.short_description).toBe('Mô tả ngắn cho sản phẩm');
      expect(result.long_description).toBe('Mô tả chi tiết cho sản phẩm diecast');
      expect(result.bullet_specs).toHaveLength(3);
      expect(result.meta_title).toBe('SEO Title');
      expect(result.meta_description).toBe('SEO meta description');
      expect(prisma.item.findFirst).toHaveBeenCalledWith({
        where: { id: 'item-1', deleted_at: null },
      });
    });

    it('should throw NOT_FOUND when item does not exist', async () => {
      prisma.item.findFirst.mockResolvedValue(null);

      await expect(
        service.generateItemDescription('nonexistent'),
      ).rejects.toThrow(AppException);
    });

    it('should throw VALIDATION_ERROR when API key is not configured', async () => {
      configGet.mockReturnValue(null); // no API key

      // Need to re-create service with missing key
      const module = await Test.createTestingModule({
        providers: [
          AiService,
          { provide: PrismaService, useValue: prisma },
          { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(null) } },
        ],
      }).compile();
      const svcNoKey = module.get<AiService>(AiService);

      prisma.item.findFirst.mockResolvedValue(mockItem);

      await expect(svcNoKey.generateItemDescription('item-1')).rejects.toThrow(AppException);
    });

    it('should throw when AI returns incomplete content', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ short_description: 'only partial' }) } }],
      });

      await expect(service.generateItemDescription('item-1')).rejects.toThrow(AppException);
    });

    it('should throw when bullet_specs only contain empty entries', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              ...descriptionResponse,
              bullet_specs: ['', '   '],
            }),
          },
        }],
      });

      await expect(service.generateItemDescription('item-1')).rejects.toMatchObject({
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      });
    });

    it('should throw when AI returns no content', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      });

      await expect(service.generateItemDescription('item-1')).rejects.toThrow(AppException);
    });

    it('should throw when AI returns malformed JSON', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{not-json}' } }],
      });

      await expect(service.generateItemDescription('item-1')).rejects.toMatchObject({
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      });
    });

    it('should wrap OpenAI API errors as AppException', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      mockCreate.mockRejectedValueOnce(new Error('API rate limit'));

      await expect(service.generateItemDescription('item-1')).rejects.toThrow(AppException);
    });

    it('should map OpenAI 429 errors to RATE_LIMIT_EXCEEDED', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      mockCreate.mockRejectedValueOnce({ status: 429, message: 'Too many requests' });

      await expect(service.generateItemDescription('item-1')).rejects.toMatchObject({
        errorCode: ErrorCode.RATE_LIMIT_EXCEEDED,
      });
    });
  });

  // ============================================================
  // generateFacebookPost
  // ============================================================
  describe('generateFacebookPost', () => {
    beforeEach(() => {
      // Override mock for FB post response (plain text, not JSON)
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '🔥 Hot Wheels Civic tuyệt đẹp! #diecast' } }],
      });
    });

    it('should generate Facebook post and return content string', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);

      const result = await service.generateFacebookPost('item-1');

      expect(result).toHaveProperty('content');
      expect(result.content).toBe('🔥 Hot Wheels Civic tuyệt đẹp! #diecast');
    });

    it('should throw NOT_FOUND when item does not exist', async () => {
      prisma.item.findFirst.mockResolvedValue(null);

      await expect(
        service.generateFacebookPost('nonexistent'),
      ).rejects.toThrow(AppException);
    });

    it('should throw when AI returns no content', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      });

      await expect(service.generateFacebookPost('item-1')).rejects.toThrow(AppException);
    });

    it('should wrap OpenAI API errors as AppException', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      mockCreate.mockRejectedValueOnce(new Error('Timeout'));

      await expect(service.generateFacebookPost('item-1')).rejects.toThrow(AppException);
    });

    it('should trim whitespace from generated Facebook post content', async () => {
      prisma.item.findFirst.mockResolvedValue(mockItem);
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '  caption with spaces  ' } }],
      });

      await expect(service.generateFacebookPost('item-1')).resolves.toEqual({
        content: 'caption with spaces',
      });
    });
  });

  // ============================================================
  // analyzeImages
  // ============================================================
  describe('analyzeImages', () => {
    const analysisResult = {
      aiJson: {
        brand: 'Hot Wheels',
        car_brand: 'Nissan',
        model_brand: 'GT-R R35',
        scale: '1:64',
        color: 'Red',
        product_code: 'HW-001',
      },
      confidence: { brand: 0.9, model_name: 0.8, scale: 0.6 },
      extracted_text: 'Hot Wheels Nissan GT-R',
    };

    it('should analyze images and return structured result', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(analysisResult) } }],
      });

      const buffers = [Buffer.from('image-data-1'), Buffer.from('image-data-2')];
      const result = await service.analyzeImages(buffers);

      expect(result.aiJson.brand).toBe('Hot Wheels');
      expect(result.aiJson.car_brand).toBe('Nissan');
      expect(result.confidence.brand).toBe(0.9);
      expect(result.extracted_text).toBe('Hot Wheels Nissan GT-R');

      // Verify OpenAI was called with image_url messages
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 1000,
          response_format: { type: 'json_object' },
        }),
      );
    });

    it('should convert image buffers to base64 data URLs', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(analysisResult) } }],
      });

      const buffer = Buffer.from('test-image');
      await service.analyzeImages([buffer]);

      const callArgs = mockCreate.mock.calls[0][0];
      const userContent = callArgs.messages[1].content;
      const imageMsg = userContent.find((c: { type: string }) => c.type === 'image_url');
      expect(imageMsg.image_url.url).toBe(`data:image/jpeg;base64,${buffer.toString('base64')}`);
    });

    it('should throw when AI returns no content', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      });

      await expect(service.analyzeImages([Buffer.from('img')])).rejects.toThrow(AppException);
    });

    it('should throw when AI returns malformed analysis JSON', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '```json not valid ```' } }],
      });

      await expect(service.analyzeImages([Buffer.from('img')])).rejects.toMatchObject({
        errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      });
    });

    it('should wrap OpenAI errors as AppException', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Vision model unavailable'));

      await expect(service.analyzeImages([Buffer.from('img')])).rejects.toThrow(AppException);
    });

    it('should map OpenAI 4xx errors to VALIDATION_ERROR for analyzeImages', async () => {
      mockCreate.mockRejectedValueOnce({ status: 400, message: 'Invalid image payload' });

      await expect(service.analyzeImages([Buffer.from('img')])).rejects.toMatchObject({
        errorCode: ErrorCode.VALIDATION_ERROR,
      });
    });

    it('should throw VALIDATION_ERROR when API key is missing', async () => {
      const module = await Test.createTestingModule({
        providers: [
          AiService,
          { provide: PrismaService, useValue: prisma },
          { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(null) } },
        ],
      }).compile();
      const svcNoKey = module.get<AiService>(AiService);

      await expect(svcNoKey.analyzeImages([Buffer.from('img')])).rejects.toThrow(AppException);
    });
  });

  // ============================================================
  // buildPrompt
  // ============================================================
  describe('buildPrompt', () => {
    it('should include item details in prompt', () => {
      const prompt = (service as unknown as { buildPrompt: (item: typeof mockItem) => string }).buildPrompt(mockItem);

      expect(prompt).toContain('Hot Wheels Civic');
      expect(prompt).toContain('1:64');
      expect(prompt).toContain('Hot Wheels');
    });

    it('should include custom instructions when provided', () => {
      const prompt = (service as unknown as { buildPrompt: (item: typeof mockItem, instructions?: string) => string })
        .buildPrompt(mockItem, 'Focus on rarity');

      expect(prompt).toContain('Focus on rarity');
    });
  });

  // ============================================================
  // buildFbPostPrompt
  // ============================================================
  describe('buildFbPostPrompt', () => {
    it('should build FB post prompt with item info', () => {
      const prompt = (service as unknown as { buildFbPostPrompt: (item: typeof mockItem) => string })
        .buildFbPostPrompt(mockItem);

      expect(prompt).toContain('Hot Wheels Civic');
    });
  });
});
