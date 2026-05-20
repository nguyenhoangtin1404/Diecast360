import { Module } from '@nestjs/common';
import { PublicService } from './public.service';
import { PublicShopResolverService } from './public-shop-resolver.service';
import { PublicController } from './public.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { ItemsModule } from '../items/items.module';

@Module({
  imports: [PrismaModule, StorageModule, ItemsModule],
  controllers: [PublicController],
  providers: [PublicService, PublicShopResolverService],
})
export class PublicModule {}

