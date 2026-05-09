import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageService } from './storage.interface';
import { createR2S3ClientAndBucket, normalizeR2ObjectKey } from './r2-s3.factory';

function contentTypeForFilename(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() || '';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'application/octet-stream';
}

function copySourceHeader(bucket: string, sourceKey: string): string {
  return `${bucket}/${sourceKey.split('/').map(encodeURIComponent).join('/')}`;
}

@Injectable()
export class R2StorageService implements IStorageService {
  private readonly client: ReturnType<typeof createR2S3ClientAndBucket>['client'];
  private readonly bucket: string;
  private readonly urlTtlMs: number;

  constructor(private readonly config: ConfigService) {
    const { client, bucket } = createR2S3ClientAndBucket(config);
    this.client = client;
    this.bucket = bucket;
    this.urlTtlMs = Number(this.config.get('MEDIA_URL_TTL_MS')) || 7 * 24 * 60 * 60 * 1000;
  }

  async saveFile(file: Buffer, filename: string, subfolder?: string): Promise<string> {
    const relativePath = subfolder ? `${subfolder}/${filename}` : filename;
    const key = normalizeR2ObjectKey(relativePath);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentTypeForFilename(filename),
      }),
    );
    return relativePath;
  }

  async deleteFile(filePath: string): Promise<void> {
    const key = normalizeR2ObjectKey(filePath);
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch {
      // Best-effort; mirror LocalStorageService ignoring missing files
    }
  }

  async moveFile(
    currentPath: string,
    newFilename: string,
    destinationSubfolder: string,
  ): Promise<string> {
    const sourceKey = normalizeR2ObjectKey(currentPath);
    const destRelative = `${destinationSubfolder}/${newFilename}`;
    const destKey = normalizeR2ObjectKey(destRelative);

    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: copySourceHeader(this.bucket, sourceKey),
        Key: destKey,
        ContentType: contentTypeForFilename(newFilename),
        MetadataDirective: 'REPLACE',
      }),
    );

    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: sourceKey }));
    return destRelative;
  }

  async getFileUrl(filePath: string): Promise<string> {
    const key = normalizeR2ObjectKey(filePath);
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const expiresIn = Math.max(1, Math.floor(this.urlTtlMs / 1000));
    return getSignedUrl(this.client, cmd, { expiresIn });
  }
}
