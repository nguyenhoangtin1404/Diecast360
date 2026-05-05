import { Module } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { ShopsController } from './shops.controller';
import { ShopSettingsController } from './shop-settings.controller';
import { StorageModule } from '../storage/storage.module';
import { UploadSupportModule } from '../common/upload/upload-support.module';

@Module({
  imports: [StorageModule, UploadSupportModule],
  controllers: [ShopsController, ShopSettingsController],
  providers: [ShopsService],
  exports: [ShopsService],
})
export class ShopsModule {}
