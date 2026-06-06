import { Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { QrService } from './qr.service';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../common/prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { FacebookModule } from '../integrations/facebook/facebook.module';
import { CategoriesModule } from '../categories/categories.module';
import { ItemsCrudService } from './services/items-crud.service';
import { ItemsSearchService } from './services/items-search.service';
import { ItemsExportService } from './services/items-export.service';
import { ItemsFacebookService } from './services/items-facebook.service';
import { ItemsPreorderService } from './services/items-preorder.service';

import { AiDraftController } from './ai-draft.controller';

@Module({
  imports: [PrismaModule, StorageModule, AiModule, FacebookModule, CategoriesModule],
  controllers: [ItemsController, AiDraftController],
  providers: [
    ItemsCrudService,
    ItemsSearchService,
    ItemsExportService,
    ItemsFacebookService,
    ItemsPreorderService,
    ItemsService,
    QrService,
  ],
  exports: [ItemsService, QrService],
})
export class ItemsModule {}
