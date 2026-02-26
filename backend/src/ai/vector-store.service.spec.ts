import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { VectorStoreService } from './vector-store.service';

// Mock Pinecone
const mockUpsert = jest.fn().mockResolvedValue({});
const mockDeleteOne = jest.fn().mockResolvedValue({});
const mockQuery = jest.fn().mockResolvedValue({
  matches: [
    { id: 'item-1', score: 0.95 },
    { id: 'item-2', score: 0.8 },
  ],
});
const mockIndex = { upsert: mockUpsert, deleteOne: mockDeleteOne, query: mockQuery };

jest.mock('@pinecone-database/pinecone', () => {
  return {
    Pinecone: jest.fn().mockImplementation(() => ({
      index: jest.fn().mockReturnValue(mockIndex),
    })),
    Index: jest.fn(),
  };
});

describe('VectorStoreService', () => {
  let service: VectorStoreService;

  describe('with valid config', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          VectorStoreService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'PINECONE_API_KEY') return 'test-key';
                if (key === 'PINECONE_INDEX') return 'test-index';
                return null;
              }),
            },
          },
        ],
      }).compile();

      service = module.get<VectorStoreService>(VectorStoreService);
      await service.onModuleInit();
    });

    afterEach(() => jest.clearAllMocks());

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize successfully with valid config', async () => {
      const result = await service.search([0.1, 0.2], 5);
      expect(result).toEqual(['item-1', 'item-2']);
    });

    describe('upsertItem', () => {
      it('should upsert item to vector store with correct parameters', async () => {
        const embedding = [0.1, 0.2, 0.3];
        const metadata = { name: 'Test Item', brand: 'Hot Wheels' };

        await service.upsertItem('item-1', embedding, metadata);

        expect(mockUpsert).toHaveBeenCalledWith({
          records: [
            expect.objectContaining({
              id: 'item-1',
              values: embedding,
              metadata,
            }),
          ],
        });
      });
    });

    describe('deleteItem', () => {
      it('should delete item from vector store by ID', async () => {
        await service.deleteItem('item-1');

        expect(mockDeleteOne).toHaveBeenCalledWith({ id: 'item-1' });
      });
    });

    describe('search', () => {
      it('should return matching item IDs sorted by score', async () => {
        const result = await service.search([0.1, 0.2], 10);

        expect(result).toEqual(['item-1', 'item-2']);
        expect(mockQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            vector: [0.1, 0.2],
            topK: 10,
          }),
        );
      });
    });
  });

  describe('without config (not ready)', () => {
    let serviceNotReady: VectorStoreService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          VectorStoreService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(null),
            },
          },
        ],
      }).compile();

      serviceNotReady = module.get<VectorStoreService>(VectorStoreService);
      await serviceNotReady.onModuleInit();
    });

    it('should skip upsert when not ready', async () => {
      await serviceNotReady.upsertItem('item-1', [0.1], { name: 'Test' });

      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('should skip delete when not ready', async () => {
      await serviceNotReady.deleteItem('item-1');

      expect(mockDeleteOne).not.toHaveBeenCalled();
    });

    it('should return empty array on search when not ready', async () => {
      const result = await serviceNotReady.search([0.1], 5);

      expect(result).toEqual([]);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });
});
