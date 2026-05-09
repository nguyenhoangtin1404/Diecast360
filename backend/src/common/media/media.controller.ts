import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, S3ServiceException } from '@aws-sdk/client-s3';
import { verifySignedMediaParams } from './signed-media.util';
import { resolveMediaSigningSecret } from './media-signing-secret';
import {
  createR2S3ClientAndBucket,
  isR2StorageDriver,
  normalizeR2ObjectKey,
} from '../../storage/r2-s3.factory';
import { imageMimeAndExtForPath } from './media-mime.util';

function isS3NoSuchKey(err: unknown): boolean {
  if (err instanceof S3ServiceException) {
    return err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404;
  }
  return err instanceof Error && err.name === 'NoSuchKey';
}

function assertSafeR2ObjectKeyFromPayload(p: string): void {
  const key = normalizeR2ObjectKey(p);
  const segments = key.split('/');
  for (const seg of segments) {
    if (seg === '' || seg === '.' || seg === '..' || seg.includes('\\')) {
      throw new ForbiddenException('Invalid media path');
    }
  }
}

/**
 * Endpoint binary thô: không bọc {@link ResponseInterceptor} ({ ok, data }).
 * Dùng cho &lt;img src&gt; / tải file; không gọi như JSON API envelope.
 */
@Controller('media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);
  private r2MediaCtx: ReturnType<typeof createR2S3ClientAndBucket> | null = null;

  constructor(private readonly config: ConfigService) {}

  private getR2MediaContext(): ReturnType<typeof createR2S3ClientAndBucket> {
    if (!this.r2MediaCtx) {
      this.r2MediaCtx = createR2S3ClientAndBucket(this.config);
    }
    return this.r2MediaCtx;
  }

  @Get()
  async serveSigned(
    @Query('d') d: string | undefined,
    @Query('s') s: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    let secret: string;
    try {
      secret = resolveMediaSigningSecret(this.config);
    } catch {
      throw new ForbiddenException('Media signing is not configured');
    }

    const payload = verifySignedMediaParams(d, s, secret);
    if (!payload) {
      throw new BadRequestException('Invalid or expired media link');
    }

    const { mime, ext } = imageMimeAndExtForPath(payload.p);

    if (isR2StorageDriver(this.config)) {
      assertSafeR2ObjectKeyFromPayload(payload.p);
      const key = normalizeR2ObjectKey(payload.p);

      let r2: ReturnType<typeof createR2S3ClientAndBucket>;
      try {
        r2 = this.getR2MediaContext();
      } catch (e) {
        this.logger.error(
          `R2 media proxy misconfigured: ${e instanceof Error ? e.message : String(e)}`,
        );
        throw new ForbiddenException('Object storage is not configured');
      }

      try {
        const out = await r2.client.send(
          new GetObjectCommand({ Bucket: r2.bucket, Key: key }),
        );
        if (!out.Body) {
          res.status(404).end();
          return;
        }

        res.setHeader('Content-Type', mime);
        res.setHeader('Cache-Control', 'private, max-age=3600');
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
          res.setHeader('Content-Disposition', 'inline');
        }

        const stream = out.Body as NodeJS.ReadableStream;
        stream.on('error', (err) => {
          this.logger.warn(
            `R2 media stream failed: ${err instanceof Error ? err.name : 'Error'}`,
          );
          if (!res.headersSent) {
            res.status(500).end();
          }
        });
        stream.pipe(res);
      } catch (err) {
        if (isS3NoSuchKey(err)) {
          res.status(404).end();
          return;
        }
        this.logger.warn(
          `R2 GetObject failed: ${err instanceof Error ? err.message : String(err)}`,
        );
        if (!res.headersSent) {
          res.status(502).end();
        }
      }
      return;
    }

    const uploadDir = this.config.get<string>('UPLOAD_DIR') || './uploads';
    const root = path.resolve(process.cwd(), uploadDir);
    const absolute = path.resolve(root, payload.p);
    const rel = path.relative(root, absolute);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new ForbiddenException('Invalid media path');
    }

    try {
      await fs.access(absolute);
    } catch {
      res.status(404).end();
      return;
    }

    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      res.setHeader('Content-Disposition', 'inline');
    }

    const stream = createReadStream(absolute);
    stream.on('error', (err) => {
      this.logger.warn(
        `Media stream failed: ${err instanceof Error ? err.name : 'Error'}`,
      );
      if (!res.headersSent) {
        res.status(500).end();
      }
    });
    stream.pipe(res);
  }
}
