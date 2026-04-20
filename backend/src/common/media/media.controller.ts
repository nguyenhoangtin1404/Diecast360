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
import { verifySignedMediaParams } from './signed-media.util';
import { resolveMediaSigningSecret } from './media-signing-secret';

/**
 * Endpoint binary thô: không bọc {@link ResponseInterceptor} ({ ok, data }).
 * Dùng cho &lt;img src&gt; / tải file; không gọi như JSON API envelope.
 */
@Controller('media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);

  constructor(private readonly config: ConfigService) {}

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

    const ext = payload.p.toLowerCase().split('.').pop() || '';
    const mime =
      ext === 'jpg' || ext === 'jpeg'
        ? 'image/jpeg'
        : ext === 'png'
          ? 'image/png'
          : ext === 'webp'
            ? 'image/webp'
            : ext === 'gif'
              ? 'image/gif'
              : 'application/octet-stream';

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
