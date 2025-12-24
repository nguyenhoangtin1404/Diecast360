import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImageProcessorService {
  async processImage(
    buffer: Buffer,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    } = {},
  ): Promise<Buffer> {
    const { maxWidth = 1920, maxHeight = 1920, quality = 90 } = options;

    return sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
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

