import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { buildSignedMediaFileUrl } from '../common/media/signed-media.util';
import { resolveMediaSigningSecret } from '../common/media/media-signing-secret';
import { IStorageService } from './storage.interface';

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly uploadDir: string;

  constructor(private readonly config: ConfigService) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR') || './uploads';
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


  async moveFile(currentPath: string, newFilename: string, destinationSubfolder: string): Promise<string> {
    const fullCurrentPath = path.join(this.uploadDir, currentPath);
    
    const destDir = path.join(this.uploadDir, destinationSubfolder);
    await fs.mkdir(destDir, { recursive: true });
    
    const destPath = path.join(destDir, newFilename);
    const relativeDestPath = path.join(destinationSubfolder, newFilename).replace(/\\/g, '/');

    try {
      await fs.rename(fullCurrentPath, destPath);
      return relativeDestPath;
    } catch (error) {
      // If rename fails (e.g. cross-device), try copy + unlink
      await fs.copyFile(fullCurrentPath, destPath);
      await fs.unlink(fullCurrentPath);
      return relativeDestPath;
    }
  }

  getFileUrl(filePath: string): string {
    const backend = (this.config.get<string>('BACKEND_URL') || 'http://localhost:3000').replace(/\/$/, '');
    const apiBase = `${backend}/api/v1`;
    const secret = resolveMediaSigningSecret(this.config);
    const ttlMs = Number(this.config.get('MEDIA_URL_TTL_MS')) || 7 * 24 * 60 * 60 * 1000;
    const cleanPath = filePath.replace(/^\.\//, '').replace(/^\//, '');
    return buildSignedMediaFileUrl(apiBase, cleanPath, secret, ttlMs);
  }
}

