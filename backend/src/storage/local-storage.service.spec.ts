import { ConfigService } from '@nestjs/config';
import { LocalStorageService } from './local-storage.service';
import { verifySignedMediaParams } from '../common/media/signed-media.util';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fs/promises
jest.mock('fs/promises');

const mockedFs = jest.mocked(fs);

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  const originalEnv = process.env;
  const mediaSigningSecret = 'm'.repeat(32);

  const mockConfig = (): ConfigService =>
    ({
      get: jest.fn((key: string) => {
        if (key === 'UPLOAD_DIR') return '/test/uploads';
        if (key === 'BACKEND_URL') return 'http://localhost:3000';
        if (key === 'MEDIA_SIGNING_SECRET') return mediaSigningSecret;
        if (key === 'JWT_SECRET') return 'short';
        if (key === 'MEDIA_URL_TTL_MS') return 3600000;
        return undefined;
      }),
    }) as unknown as ConfigService;

  beforeEach(() => {
    process.env = { ...originalEnv, UPLOAD_DIR: '/test/uploads' };
    mockedFs.access.mockResolvedValue(undefined);
    mockedFs.mkdir.mockResolvedValue(undefined);
    mockedFs.writeFile.mockResolvedValue(undefined);
    mockedFs.unlink.mockResolvedValue(undefined);
    mockedFs.rename.mockResolvedValue(undefined);
    mockedFs.copyFile.mockResolvedValue(undefined);

    service = new LocalStorageService(mockConfig());
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================================
  // saveFile
  // ============================================================
  describe('saveFile', () => {
    it('should save file to upload directory', async () => {
      const buffer = Buffer.from('test-data');
      const result = await service.saveFile(buffer, 'test.jpg');

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        path.join('/test/uploads', 'test.jpg'),
        buffer,
      );
      expect(result).toBe('test.jpg');
    });

    it('should save file to subfolder', async () => {
      const buffer = Buffer.from('test-data');
      const result = await service.saveFile(buffer, 'test.jpg', 'images');

      expect(mockedFs.mkdir).toHaveBeenCalled();
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        path.join('/test/uploads', 'images', 'test.jpg'),
        buffer,
      );
      expect(result).toBe('images/test.jpg');
    });
  });

  // ============================================================
  // deleteFile
  // ============================================================
  describe('deleteFile', () => {
    it('should delete file', async () => {
      await service.deleteFile('images/test.jpg');

      expect(mockedFs.unlink).toHaveBeenCalledWith(
        path.join('/test/uploads', 'images/test.jpg'),
      );
    });

    it('should silently handle file-not-found errors', async () => {
      mockedFs.unlink.mockRejectedValue(new Error('ENOENT'));

      // Should not throw
      await service.deleteFile('nonexistent.jpg');
    });
  });

  // ============================================================
  // moveFile
  // ============================================================
  describe('moveFile', () => {
    it('should move file via rename', async () => {
      const result = await service.moveFile(
        'drafts/old.jpg',
        'new.jpg',
        'images',
      );

      expect(mockedFs.rename).toHaveBeenCalled();
      expect(result).toBe('images/new.jpg');
    });

    it('should fallback to copy + unlink when rename fails', async () => {
      mockedFs.rename.mockRejectedValue(new Error('EXDEV'));

      const result = await service.moveFile(
        'drafts/old.jpg',
        'new.jpg',
        'images',
      );

      expect(mockedFs.copyFile).toHaveBeenCalled();
      expect(mockedFs.unlink).toHaveBeenCalled();
      expect(result).toBe('images/new.jpg');
    });
  });

  // ============================================================
  // getFileUrl
  // ============================================================
  describe('getFileUrl', () => {
    it('should return signed media URL', () => {
      const href = service.getFileUrl('images/test.jpg');
      const u = new URL(href);
      expect(u.pathname).toBe('/api/v1/media');
      const d = u.searchParams.get('d');
      const s = u.searchParams.get('s');
      expect(d).toBeTruthy();
      expect(s).toBeTruthy();
      const payload = verifySignedMediaParams(d!, s!, mediaSigningSecret);
      expect(payload?.p).toBe('images/test.jpg');
    });

    it('should strip leading ./ from path', () => {
      const href = service.getFileUrl('./images/test.jpg');
      const u = new URL(href);
      const payload = verifySignedMediaParams(u.searchParams.get('d')!, u.searchParams.get('s')!, mediaSigningSecret);
      expect(payload?.p).toBe('images/test.jpg');
    });

    it('should strip leading / from path', () => {
      const href = service.getFileUrl('/images/test.jpg');
      const u = new URL(href);
      const payload = verifySignedMediaParams(u.searchParams.get('d')!, u.searchParams.get('s')!, mediaSigningSecret);
      expect(payload?.p).toBe('images/test.jpg');
    });
  });
});
