import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { imageMimeAndExtForPath } from '../common/media/media-mime.util';
import { parseMediaUrlTtlMs } from '../common/media/media-url-ttl.util';
import { IStorageService } from './storage.interface';
import { createR2S3ClientAndBucket, normalizeR2ObjectKey } from './r2-s3.factory';

function copySourceHeader(bucket: string, sourceKey: string): string {
  return `${bucket}/${sourceKey.split('/').map(encodeURIComponent).join('/')}`;
}

function moveDeleteBackoffMs(attemptIndex: number): number {
  if (typeof process.env.JEST_WORKER_ID === 'string') {
    return 0;
  }
  return Math.min(2000, 100 * 2 ** attemptIndex);
}

@Injectable()
export class R2StorageService implements IStorageService {
  private readonly logger = new Logger(R2StorageService.name);
  private readonly client: ReturnType<typeof createR2S3ClientAndBucket>['client'];
  private readonly bucket: string;
  private readonly urlTtlMs: number;

  constructor(private readonly config: ConfigService) {
    const { client, bucket } = createR2S3ClientAndBucket(config);
    this.client = client;
    this.bucket = bucket;
    this.urlTtlMs = parseMediaUrlTtlMs(config);
  }

  async saveFile(file: Buffer, filename: string, subfolder?: string): Promise<string> {
    const relativePath = subfolder ? `${subfolder}/${filename}` : filename;
    const key = normalizeR2ObjectKey(relativePath);
    const { mime } = imageMimeAndExtForPath(filename);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: mime,
      }),
    );
    return relativePath;
  }

  async deleteFile(filePath: string): Promise<void> {
    const key = normalizeR2ObjectKey(filePath);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async moveFile(
    currentPath: string,
    newFilename: string,
    destinationSubfolder: string,
  ): Promise<string> {
    const sourceKey = normalizeR2ObjectKey(currentPath);
    const destRelative = `${destinationSubfolder}/${newFilename}`;
    const destKey = normalizeR2ObjectKey(destRelative);
    const { mime } = imageMimeAndExtForPath(newFilename);

    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: copySourceHeader(this.bucket, sourceKey),
        Key: destKey,
        ContentType: mime,
        MetadataDirective: 'REPLACE',
      }),
    );

    await this.deleteSourceAfterCopyWithRetry(sourceKey, destKey);
    return destRelative;
  }

  private async deleteSourceAfterCopyWithRetry(sourceKey: string, destKey: string): Promise<void> {
    const maxAttempts = 4;
    let lastErr: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: sourceKey }));
        return;
      } catch (err) {
        lastErr = err;
        this.logger.warn(
          `DeleteObject after CopyObject failed (attempt ${attempt + 1}/${maxAttempts}) sourceKey=${sourceKey}: ${err instanceof Error ? err.message : String(err)}`,
        );
        if (attempt < maxAttempts - 1) {
          const ms = moveDeleteBackoffMs(attempt);
          if (ms > 0) {
            await new Promise((r) => setTimeout(r, ms));
          }
        }
      }
    }
    this.logger.error(
      `moveFile left duplicate objects after successful copy: sourceKey=${sourceKey} destKey=${destKey} — manual cleanup of source may be required`,
    );
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  async getFileUrl(filePath: string): Promise<string> {
    const key = normalizeR2ObjectKey(filePath);
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const expiresIn = Math.max(1, Math.floor(this.urlTtlMs / 1000));
    return getSignedUrl(this.client, cmd, { expiresIn });
  }
}
