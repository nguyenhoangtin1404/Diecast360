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
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    // Remove leading ./ or / from filePath
    const cleanPath = filePath.replace(/^\.\//, '').replace(/^\//, '');
    return `${baseUrl}/uploads/${cleanPath}`;
  }
}

