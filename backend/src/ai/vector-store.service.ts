import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pinecone, Index } from '@pinecone-database/pinecone';

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private pinecone: Pinecone;
  private index: Index;
  private readonly logger = new Logger(VectorStoreService.name);
  private isReady = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const apiKey = this.configService.get<string>('PINECONE_API_KEY');
    const indexName = this.configService.get<string>('PINECONE_INDEX');

    if (!apiKey || !indexName) {
      this.logger.warn(
        'PINECONE_API_KEY or PINECONE_INDEX not found. Vector search will be disabled.',
      );
      return;
    }

    try {
      this.pinecone = new Pinecone({ apiKey });
      this.index = this.pinecone.index(indexName);
      this.isReady = true;
      this.logger.log(`Connected to Pinecone index: ${indexName}`);
    } catch (error) {
       this.logger.error('Failed to connect to Pinecone:', error);
    }
  }

  async upsertItem(itemId: string, embedding: number[], metadata: Record<string, string | number | boolean | string[] | null>) {
    if (!this.isReady) {
        this.logger.warn('Vector Store not ready. Skipping upsert.');
        return;
    }

    try {
      await this.index.upsert({
        records: [
          {
            id: itemId,
            values: embedding,
            metadata,
          },
        ],
      });
      // this.logger.debug(`Upserted item ${itemId} to vector store.`);
    } catch (error) {
      this.logger.error(`Failed to upsert item ${itemId}:`, error);
    }
  }

  async deleteItem(itemId: string) {
    if (!this.isReady) return;

    try {
      await this.index.deleteOne({ id: itemId });
      this.logger.debug(`Deleted item ${itemId} from vector store.`);
    } catch (error) {
      this.logger.error(`Failed to delete item ${itemId}:`, error);
    }
  }

  async search(embedding: number[], topK: number = 10): Promise<string[]> {
    if (!this.isReady) return [];

    try {
      const response = await this.index.query({
        vector: embedding,
        topK,
        includeMetadata: false, // We only need IDs to fetch from DB
      });

      return response.matches.map((match) => match.id);
    } catch (error) {
      this.logger.error('Error searching vector store:', error);
      return [];
    }
  }
}
