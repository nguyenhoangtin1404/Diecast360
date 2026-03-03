import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService, EmbeddingUnavailableError } from './embedding.service';

const createEmbeddingMock = jest.fn();

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: createEmbeddingMock,
      },
    })),
  };
});

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  describe('with valid API key', () => {
    beforeEach(async () => {
      createEmbeddingMock.mockResolvedValue({
        data: [
          {
            embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
          },
        ],
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmbeddingService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'OPENAI_API_KEY') return 'test-key';
                return null;
              }),
            },
          },
        ],
      }).compile();

      service = module.get<EmbeddingService>(EmbeddingService);
    });

    afterEach(() => jest.clearAllMocks());

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    describe('getEmbedding', () => {
      it('should return embedding vector for text', async () => {
        const result = await service.getEmbedding('test text');
        expect(result).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
      });

      it('should return empty array for empty text', async () => {
        const result = await service.getEmbedding('');
        expect(result).toEqual([]);
      });

      it('should clean newlines from text', async () => {
        const result = await service.getEmbedding('line1\nline2\nline3');
        expect(result).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
      });

      it('should throw when OpenAI request fails', async () => {
        createEmbeddingMock.mockRejectedValueOnce(new Error('openai failed'));
        await expect(service.getEmbedding('test text')).rejects.toThrow(EmbeddingUnavailableError);
      });

      it('should throw for malformed OpenAI response', async () => {
        createEmbeddingMock.mockResolvedValueOnce({ data: [{}] });
        await expect(service.getEmbedding('test text')).rejects.toThrow(EmbeddingUnavailableError);
      });
    });
  });

  describe('without API key', () => {
    let serviceNoKey: EmbeddingService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmbeddingService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(null),
            },
          },
        ],
      }).compile();

      serviceNoKey = module.get<EmbeddingService>(EmbeddingService);
    });

    it('should create service but warn about missing key', () => {
      expect(serviceNoKey).toBeDefined();
    });

    it('should throw when getEmbedding is called without API key', async () => {
      await expect(serviceNoKey.getEmbedding('test text')).rejects.toThrow(EmbeddingUnavailableError);
    });

    it('should still return empty array for empty text even without API key', async () => {
      const result = await serviceNoKey.getEmbedding('');
      expect(result).toEqual([]);
    });
  });
});
