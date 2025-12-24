import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { IStorageService } from './storage.interface';

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Buffer, filename: string, subfolder?: string): Promise<string> {
    await this.ensureUploadDir();

    const dir = subfolder ? path.join(this.uploadDir, subfolder) : this.uploadDir;
    await fs.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, file);

    // Return relative path from uploadDir
    return subfolder ? path.join(subfolder, filename).replace(/\\/g, '/') : filename;
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, filePath);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // File may not exist, ignore
    }
  }

  getFileUrl(filePath: string): string {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    // Remove leading ./ or / from filePath
    const cleanPath = filePath.replace(/^\.\//, '').replace(/^\//, '');
    return `${baseUrl}/uploads/${cleanPath}`;
  }
}

