import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule],
  controllers: [AiController],
  providers: [AiService, EmbeddingService, VectorStoreService],
  exports: [AiService, EmbeddingService, VectorStoreService],
})
export class AiModule {}
