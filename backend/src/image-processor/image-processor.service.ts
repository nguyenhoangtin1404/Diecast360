import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  watermark?: boolean;
}

@Injectable()
export class ImageProcessorService {
  private readonly WATERMARK_TEXT = 'DIECAST360';

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

    if (watermark) {
      const metadata = await sharp(buffer).metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;
      
      if (width > 0 && height > 0) {
        const svgImage = `
        <svg width="${width}" height="${height}">
          <style>
          .title { fill: rgba(255, 255, 255, 0.5); font-size: ${Math.max(24, Math.min(width, height) * 0.05)}px; font-weight: bold; font-family: sans-serif; }
          </style>
          <text x="95%" y="95%" text-anchor="end" class="title">${this.WATERMARK_TEXT}</text>
        </svg>
        `;
        pipeline = pipeline.composite([{ input: Buffer.from(svgImage), gravity: 'southeast' }]);
      }
    }

    return pipeline
      .jpeg({ quality })
      .toBuffer();
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

