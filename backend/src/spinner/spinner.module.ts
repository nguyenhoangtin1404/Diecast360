import { Module } from '@nestjs/common';
import { SpinnerService } from './spinner.service';
import { SpinSetsController, SpinSetController } from './spinner.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ImageProcessorModule } from '../image-processor/image-processor.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, ImageProcessorModule, StorageModule],
  controllers: [SpinSetsController, SpinSetController],
  providers: [SpinnerService],
  exports: [SpinnerService],
})
export class SpinnerModule {}

