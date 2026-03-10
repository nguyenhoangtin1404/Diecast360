import { Module } from '@nestjs/common';
import { UploadSupportService } from './upload-support.service';

@Module({
  providers: [UploadSupportService],
  exports: [UploadSupportService],
})
export class UploadSupportModule {}
