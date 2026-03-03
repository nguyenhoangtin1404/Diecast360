import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export class EmbeddingUnavailableError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'EmbeddingUnavailableError';
  }
}

@Injectable()
export class EmbeddingService {
  private openai?: OpenAI;
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not found. Embedding service is disabled.');
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    if (!text || !text.trim()) return [];

    if (!this.openai) {
      this.logger.warn('Embedding request skipped because OpenAI client is not configured.');
      throw new EmbeddingUnavailableError('OpenAI client is not configured');
    }

    // Clean text to avoid issues with newlines
    const cleanText = text.replace(/\n/g, ' ');

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: cleanText,
        encoding_format: 'float',
      });

      const embedding = response.data?.[0]?.embedding;
      if (!Array.isArray(embedding)) {
        this.logger.warn('Embedding response did not include a valid embedding vector.');
        throw new EmbeddingUnavailableError('Embedding response missing vector');
      }

      return embedding;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Error creating embedding: ${err.message}`,
        err.stack,
      );
      if (err instanceof EmbeddingUnavailableError) {
        throw err;
      }
      throw new EmbeddingUnavailableError('OpenAI embedding request failed', err);
    }
  }
}
