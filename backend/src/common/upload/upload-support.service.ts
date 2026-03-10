import { Injectable, Logger, LoggerService } from '@nestjs/common';
import * as sharp from 'sharp';
import { AppException, ErrorCode } from '../exceptions/http-exception.filter';
import { IStorageService } from '../../storage/storage.interface';

@Injectable()
export class UploadSupportService {
  resolveAllowedMimeTypes(
    logger: LoggerService,
    defaultValue: string = 'image/jpeg,image/png',
  ): string[] {
    const allowed = (process.env.ALLOWED_MIME || defaultValue)
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    if (allowed.length === 0) {
      logger.warn('ALLOWED_MIME config is empty; fallback to image/jpeg,image/png');
      return ['image/jpeg', 'image/png'];
    }

    return allowed;
  }

  resolveMaxUploadBytes(logger: LoggerService, defaultMb: number = 10): number {
    const rawMaxUploadMb = process.env.MAX_UPLOAD_MB;
    const parsed = Number.parseInt(rawMaxUploadMb || String(defaultMb), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      if (rawMaxUploadMb !== undefined) {
        logger.warn(`Invalid MAX_UPLOAD_MB="${rawMaxUploadMb}". Fallback to default ${defaultMb}MB.`);
      }
      return defaultMb * 1024 * 1024;
    }

    return parsed * 1024 * 1024;
  }

  resolveMaxSpinnerFrames(logger: LoggerService, defaultFrames: number = 48): number {
    const rawMaxFrames = process.env.MAX_SPINNER_FRAMES;
    const parsed = Number.parseInt(
      rawMaxFrames || String(defaultFrames),
      10,
    );
    if (!Number.isFinite(parsed) || parsed <= 0) {
      if (rawMaxFrames !== undefined) {
        logger.warn(
          `Invalid MAX_SPINNER_FRAMES="${rawMaxFrames}". Fallback to default ${defaultFrames}.`,
        );
      }
      return defaultFrames;
    }

    return parsed;
  }

  async validateFile(
    file: Express.Multer.File,
    allowedMimeTypes: string[],
    maxUploadBytes: number,
  ): Promise<void> {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new AppException(
        ErrorCode.UPLOAD_INVALID_TYPE,
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
      );
    }

    if (file.size > maxUploadBytes) {
      throw new AppException(
        ErrorCode.UPLOAD_TOO_LARGE,
        `File size exceeds maximum of ${Math.floor(maxUploadBytes / (1024 * 1024))}MB`,
      );
    }

    let detectedMime: string | undefined;
    try {
      const metadata = await sharp(file.buffer).metadata();
      const format = metadata.format ?? '';
      detectedMime = format ? `image/${format === 'jpg' ? 'jpeg' : format}` : undefined;
    } catch {
      detectedMime = undefined;
    }

    if (!detectedMime || !allowedMimeTypes.includes(detectedMime)) {
      throw new AppException(
        ErrorCode.UPLOAD_INVALID_TYPE,
        `Invalid file content. Allowed types: ${allowedMimeTypes.join(', ')}`,
      );
    }
  }

  async cleanupSavedFiles(
    storage: IStorageService,
    logger: Logger,
    paths: string[],
    context: string,
  ) {
    await Promise.all(
      paths.map(async (path) => {
        try {
          await storage.deleteFile(path);
        } catch (error) {
          logger.warn(`[${context}] Failed to cleanup file: ${path}`, error as Error);
        }
      }),
    );
  }

  async delayBeforeRetry(attempt: number) {
    const delayMs = Math.pow(2, attempt) * 50 + Math.random() * 50;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
