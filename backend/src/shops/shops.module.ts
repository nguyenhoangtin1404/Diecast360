import { Module } from '@nestjs/common';
import { ShopsService } from './shops.service';
import { ShopsController } from './shops.controller';
import { ShopSettingsController } from './shop-settings.controller';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [ShopsController, ShopSettingsController],
  providers: [ShopsService],
  exports: [ShopsService],
})
export class ShopsModule {}
