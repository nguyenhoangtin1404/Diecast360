import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { R2StorageService } from './r2-storage.service';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand: jest.fn().mockImplementation((input: object) => ({ input })),
  GetObjectCommand: jest.fn().mockImplementation((input: object) => ({ input })),
  CopyObjectCommand: jest.fn().mockImplementation((input: object) => ({ input })),
  DeleteObjectCommand: jest.fn().mockImplementation((input: object) => ({ input })),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue(
    'https://test-account.r2.cloudflarestorage.com/test-bucket/spinner/frame.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=test',
  ),
}));

const mockedGetSignedUrl = jest.mocked(getSignedUrl);
const MockedS3Client = jest.mocked(S3Client);

describe('R2StorageService', () => {
  let service: R2StorageService;

  const mockConfig = (): ConfigService =>
    ({
      get: jest.fn((key: string) => {
        if (key === 'R2_ACCOUNT_ID') return 'test-account';
        if (key === 'R2_ACCESS_KEY_ID') return 'test-access-key';
        if (key === 'R2_SECRET_ACCESS_KEY') return 'test-secret-key';
        if (key === 'R2_BUCKET') return 'test-bucket';
        if (key === 'MEDIA_URL_TTL_MS') return 3600_000;
        return undefined;
      }),
    }) as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({});
    service = new R2StorageService(mockConfig());
  });

  it('should configure S3 client for R2 endpoint', () => {
    expect(MockedS3Client).toHaveBeenCalledWith(
      expect.objectContaining({
        region: 'auto',
        endpoint: 'https://test-account.r2.cloudflarestorage.com',
        forcePathStyle: true,
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
        },
      }),
    );
  });

  describe('saveFile', () => {
    it('should PutObject and return spinner/frame.jpg style path', async () => {
      const buffer = Buffer.from('img');
      const result = await service.saveFile(buffer, 'frame.jpg', 'spinner');

      expect(PutObjectCommand).toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalledTimes(1);
      const cmd = mockSend.mock.calls[0][0] as { input: Record<string, unknown> };
      expect(cmd.input.Bucket).toBe('test-bucket');
      expect(cmd.input.Key).toBe('spinner/frame.jpg');
      expect(cmd.input.Body).toBe(buffer);
      expect(cmd.input.ContentType).toBe('image/jpeg');
      expect(result).toBe('spinner/frame.jpg');
    });
  });

  describe('moveFile', () => {
    it('should CopyObject then DeleteObject and return destination path', async () => {
      const result = await service.moveFile('drafts/old.jpg', 'new.jpg', 'images');

      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(CopyObjectCommand).toHaveBeenCalled();
      expect(DeleteObjectCommand).toHaveBeenCalled();

      const copyCmd = mockSend.mock.calls[0][0] as { input: Record<string, unknown> };
      expect(copyCmd.input.Bucket).toBe('test-bucket');
      expect(copyCmd.input.Key).toBe('images/new.jpg');
      expect(copyCmd.input.CopySource).toBe('test-bucket/drafts/old.jpg');
      expect(copyCmd.input.ContentType).toBe('image/jpeg');
      expect(copyCmd.input.MetadataDirective).toBe('REPLACE');

      const deleteCmd = mockSend.mock.calls[1][0] as { input: Record<string, unknown> };
      expect(deleteCmd.input.Key).toBe('drafts/old.jpg');

      expect(result).toBe('images/new.jpg');
    });
  });

  describe('deleteFile', () => {
    it('should DeleteObject', async () => {
      await service.deleteFile('images/x.jpg');
      expect(DeleteObjectCommand).toHaveBeenCalled();
      const cmd = mockSend.mock.calls[0][0] as { input: Record<string, unknown> };
      expect(cmd.input.Key).toBe('images/x.jpg');
    });

    it('should swallow errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('network'));
      await expect(service.deleteFile('images/x.jpg')).resolves.toBeUndefined();
    });
  });

  describe('getFileUrl', () => {
    it('should return presigned URL from getSignedUrl', async () => {
      const url = await service.getFileUrl('spinner/frame.jpg');
      expect(GetObjectCommand).toHaveBeenCalled();
      expect(mockedGetSignedUrl).toHaveBeenCalled();
      expect(url).toContain('X-Amz-');
      expect(url).toContain('r2.cloudflarestorage.com');
    });

    it('should pass expiresIn derived from MEDIA_URL_TTL_MS', async () => {
      await service.getFileUrl('a.jpg');
      expect(mockedGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ expiresIn: 3600 }),
      );
    });
  });
});
