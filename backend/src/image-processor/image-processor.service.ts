import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export class WatermarkProcessingError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'WatermarkProcessingError';
  }
}

export interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  watermark?: boolean;
}

@Injectable()
export class ImageProcessorService {
  private readonly WATERMARK_TEXT = 'DIECAST360';
  private readonly logger = new Logger(ImageProcessorService.name);

  async processImage(
    buffer: Buffer,
    options: ProcessImageOptions = {},
  ): Promise<Buffer> {
    const { maxWidth = 1920, maxHeight = 1920, quality = 90, watermark = false } = options;

    let pipeline = sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });

    try {
      if (watermark) {
        const metadata = await sharp(buffer).metadata();
        const originalWidth = metadata.width || 0;
        const originalHeight = metadata.height || 0;

        if (originalWidth > 0 && originalHeight > 0) {
          // Keep overlay size <= resized output size to avoid Sharp composite errors.
          const ratio = Math.min(
            maxWidth / originalWidth,
            maxHeight / originalHeight,
            1,
          );
          const outputWidth = Math.max(1, Math.floor(originalWidth * ratio));
          const outputHeight = Math.max(1, Math.floor(originalHeight * ratio));
          const fontSize = Math.max(24, Math.floor(Math.min(outputWidth, outputHeight) * 0.05));

          const svgImage = `
          <svg width="${outputWidth}" height="${outputHeight}">
            <style>
            .title { fill: rgba(255, 255, 255, 0.5); font-size: ${fontSize}px; font-weight: bold; font-family: sans-serif; }
            </style>
            <text x="95%" y="95%" text-anchor="end" class="title">${this.WATERMARK_TEXT}</text>
          </svg>
          `;
          pipeline = pipeline.composite([{ input: Buffer.from(svgImage), gravity: 'southeast' }]);
        } else {
          throw new WatermarkProcessingError('Source image dimensions are missing');
        }
      }

      return await pipeline
        .jpeg({ quality })
        .toBuffer();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to process image: ${err.message}`, err.stack);
      if (err instanceof WatermarkProcessingError) {
        throw err;
      }
      throw new WatermarkProcessingError('Failed to process image', err);
    }
  }

  async generateThumbnail(buffer: Buffer, size: number = 300): Promise<Buffer> {
    return sharp(buffer)
      .resize(size, size, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toBuffer();
  }

  generateFilename(originalName?: string): string {
    const ext = originalName
      ? path.extname(originalName) || '.jpg'
      : '.jpg';
    return `${uuidv4()}${ext}`;
  }

  validateImage(buffer: Buffer): boolean {
    // Check if it's a valid image by trying to read metadata
    try {
      sharp(buffer);
      return true;
    } catch {
      return false;
    }
  }
}

