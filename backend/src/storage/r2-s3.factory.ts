import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

export type R2S3ClientAndBucket = { client: S3Client; bucket: string };

export function isR2StorageDriver(config: ConfigService): boolean {
  return (config.get<string>('STORAGE_DRIVER') || 'local').trim().toLowerCase() === 'r2';
}

/** Normalize DB-relative media path to an R2 object key (forward slashes, no leading slash). */
export function normalizeR2ObjectKey(filePath: string): string {
  return filePath.replace(/^\.\//, '').replace(/^\//, '');
}

export function createR2S3ClientAndBucket(config: ConfigService): R2S3ClientAndBucket {
  const accountId = config.get<string>('R2_ACCOUNT_ID')?.trim();
  const accessKeyId = config.get<string>('R2_ACCESS_KEY_ID')?.trim();
  const secretAccessKey = config.get<string>('R2_SECRET_ACCESS_KEY')?.trim();
  const bucket = config.get<string>('R2_BUCKET')?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      'STORAGE_DRIVER=r2 requires R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET. See backend/.env.example.',
    );
  }
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
  return { client, bucket };
}
