import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageService } from './storage.interface';

function normalizeObjectKey(filePath: string): string {
  return filePath.replace(/^\.\//, '').replace(/^\//, '');
}

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
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly urlTtlMs: number;

  constructor(private readonly config: ConfigService) {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID')?.trim();
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID')?.trim();
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY')?.trim();
    const bucket = this.config.get<string>('R2_BUCKET')?.trim();
    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error(
        'STORAGE_DRIVER=r2 requires R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET. See backend/.env.example.',
      );
    }
    this.bucket = bucket;
    this.urlTtlMs = Number(this.config.get('MEDIA_URL_TTL_MS')) || 7 * 24 * 60 * 60 * 1000;
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }

  async saveFile(file: Buffer, filename: string, subfolder?: string): Promise<string> {
    const relativePath = subfolder ? `${subfolder}/${filename}` : filename;
    const key = normalizeObjectKey(relativePath);
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
    const key = normalizeObjectKey(filePath);
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
    const sourceKey = normalizeObjectKey(currentPath);
    const destRelative = `${destinationSubfolder}/${newFilename}`;
    const destKey = normalizeObjectKey(destRelative);

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
    const key = normalizeObjectKey(filePath);
    const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const expiresIn = Math.max(1, Math.floor(this.urlTtlMs / 1000));
    return getSignedUrl(this.client, cmd, { expiresIn });
  }
}
