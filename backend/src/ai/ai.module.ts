import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';
import { AiDescriptionService } from './services/ai-description.service';
import { AiFacebookService } from './services/ai-facebook.service';
import { AiImageService } from './services/ai-image.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule],
  controllers: [AiController],
  providers: [
    {
      provide: 'OPENAI_CLIENT',
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('OPENAI_API_KEY');
        return new OpenAI({ apiKey: apiKey || 'not-configured' });
      },
      inject: [ConfigService],
    },
    AiService,
    AiDescriptionService,
    AiFacebookService,
    AiImageService,
    EmbeddingService,
    VectorStoreService,
  ],
  exports: [AiService, EmbeddingService, VectorStoreService],
})
export class AiModule {}
