import { Module } from '@nestjs/common';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ImageProcessorModule } from '../image-processor/image-processor.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, ImageProcessorModule, StorageModule],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}

