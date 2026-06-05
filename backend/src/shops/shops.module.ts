import { Module } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { ShopsController } from './shops.controller';
import { ShopSettingsController } from './shop-settings.controller';
import { ShopsCrudService } from './services/shops-crud.service';
import { ShopsAppearanceService } from './services/shops-appearance.service';
import { ShopsMembersService } from './services/shops-members.service';
import { ShopsAuditService } from './services/shops-audit.service';
import { StorageModule } from '../storage/storage.module';
import { UploadSupportModule } from '../common/upload/upload-support.module';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule, StorageModule, UploadSupportModule],
  controllers: [ShopsController, ShopSettingsController],
  providers: [ShopsService, ShopsCrudService, ShopsAppearanceService, ShopsMembersService, ShopsAuditService],
  exports: [ShopsService],
})
export class ShopsModule {}
