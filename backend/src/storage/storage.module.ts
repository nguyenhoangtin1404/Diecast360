import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStorageService } from './local-storage.service';
import { R2StorageService } from './r2-storage.service';
import { IStorageService } from './storage.interface';

function assertR2Env(config: ConfigService): void {
  const keys = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'] as const;
  const missing = keys.filter((k) => !config.get<string>(k)?.trim());
  if (missing.length > 0) {
    throw new Error(
      `STORAGE_DRIVER=r2 requires these environment variables: ${missing.join(', ')}. See backend/.env.example.`,
    );
  }
}

const storageServiceProvider = {
  provide: 'IStorageService',
  useFactory: (config: ConfigService): IStorageService => {
    const driver = (config.get<string>('STORAGE_DRIVER') || 'local').trim().toLowerCase();
    if (driver === 'r2') {
      assertR2Env(config);
      return new R2StorageService(config);
    }
    return new LocalStorageService(config);
  },
  inject: [ConfigService],
};

@Module({
  imports: [ConfigModule],
  providers: [storageServiceProvider, LocalStorageService],
  exports: ['IStorageService', LocalStorageService],
})
export class StorageModule {}
