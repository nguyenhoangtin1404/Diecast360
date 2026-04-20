import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocalStorageService } from './local-storage.service';
import { IStorageService } from './storage.interface';

const StorageServiceProvider = {
  provide: 'IStorageService',
  useClass: LocalStorageService,
};

@Module({
  imports: [ConfigModule],
  providers: [StorageServiceProvider, LocalStorageService],
  exports: ['IStorageService', LocalStorageService],
})
export class StorageModule {}

