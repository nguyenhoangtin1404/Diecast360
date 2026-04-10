import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { PreordersController } from './preorders.controller';
import { PreordersService } from './preorders.service';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [PreordersController],
  providers: [PreordersService],
  exports: [PreordersService],
})
export class PreordersModule {}
