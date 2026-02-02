import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../common/prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

import { AiDraftController } from './ai-draft.controller';

@Module({
  imports: [PrismaModule, StorageModule, AiModule],
  controllers: [ItemsController, AiDraftController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}

