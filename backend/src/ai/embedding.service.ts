import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingService {
  private openai: OpenAI;
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
        this.openai = new OpenAI({ apiKey });
    } else {
        this.logger.warn('OPENAI_API_KEY not found. Embedding service will fail if used.');
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    if (!text) return [];
    
    // Clean text to avoid issues with newlines
    const cleanText = text.replace(/\n/g, ' ');

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: cleanText,
        encoding_format: 'float',
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Error creating embedding:', error);
      throw error; // Or return [] if you want fail-soft
    }
  }
}
