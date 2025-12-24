import { Module } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service';
import { IStorageService } from './storage.interface';

const StorageServiceProvider = {
  provide: 'IStorageService',
  useClass: LocalStorageService,
};

@Module({
  providers: [StorageServiceProvider, LocalStorageService],
  exports: ['IStorageService', LocalStorageService],
})
export class StorageModule {}

