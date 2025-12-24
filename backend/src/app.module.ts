import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ItemsModule } from './items/items.module';
import { ImagesModule } from './images/images.module';
import { ImageProcessorModule } from './image-processor/image-processor.module';
import { StorageModule } from './storage/storage.module';
import { SpinnerModule } from './spinner/spinner.module';
import { PublicModule } from './public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    ItemsModule,
    ImagesModule,
    ImageProcessorModule,
    StorageModule,
    SpinnerModule,
    PublicModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

