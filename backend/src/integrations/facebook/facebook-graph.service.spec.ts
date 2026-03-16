import { Test, TestingModule } from '@nestjs/testing';
import { FacebookGraphService } from './facebook-graph.service';
import { FacebookConfigService } from './facebook-config.service';
import { AppException } from '../../common/exceptions/http-exception.filter';
import { ErrorCode } from '../../common/constants/error-codes';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe('FacebookGraphService', () => {
  let service: FacebookGraphService;
  let fbConfig: {
    isConfigured: jest.Mock;
    getConfig: jest.Mock;
  };

  const mockConfig = {
    pageId: 'page-123',
    pageAccessToken: 'test-token',
    graphApiVersion: 'v21.0',
  };

  beforeEach(async () => {
    fbConfig = {
      isConfigured: jest.fn().mockReturnValue(true),
      getConfig: jest.fn().mockReturnValue(mockConfig),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacebookGraphService,
        { provide: FacebookConfigService, useValue: fbConfig },
      ],
    }).compile();

    service = module.get<FacebookGraphService>(FacebookGraphService);

    // Spy on logger to suppress output during tests
    jest
      .spyOn(
        (service as unknown as { logger: { error: jest.Mock; log: jest.Mock } })
          .logger,
        'error',
      )
      .mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publishPost', () => {
    it('should publish successfully and return post URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'page-123_post-456' }),
      });

      const result = await service.publishPost('Hello Facebook!');

      expect(result.postId).toBe('page-123_post-456');
      expect(result.postUrl).toBe(
        'https://www.facebook.com/page-123_post-456',
      );
      expect(mockFetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/page-123/feed',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            message: 'Hello Facebook!',
            access_token: 'test-token',
          }),
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it('should throw FACEBOOK_PUBLISH_ERROR on request timeout', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      await expect(service.publishPost('Test')).rejects.toMatchObject({
        errorCode: ErrorCode.FACEBOOK_PUBLISH_ERROR,
      });
    });

    it('should throw FACEBOOK_PUBLISH_ERROR when Facebook returns non-JSON (e.g. HTML error page)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => { throw new SyntaxError('Unexpected token < in JSON'); },
      });

      await expect(service.publishPost('Test')).rejects.toMatchObject({
        errorCode: ErrorCode.FACEBOOK_PUBLISH_ERROR,
      });
    });

    it('should throw FACEBOOK_AUTH_ERROR for code 190', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          error: { code: 190, message: 'Invalid token' },
        }),
      });

      await expect(service.publishPost('Test')).rejects.toMatchObject({
        errorCode: ErrorCode.FACEBOOK_AUTH_ERROR,
      });
    });

    it('should throw FACEBOOK_PERMISSION_ERROR for code 200', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          error: { code: 200, message: 'Permission denied' },
        }),
      });

      await expect(service.publishPost('Test')).rejects.toMatchObject({
        errorCode: ErrorCode.FACEBOOK_PERMISSION_ERROR,
      });
    });

    it('should throw RATE_LIMIT_EXCEEDED for code 4', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          error: { code: 4, message: 'Too many calls' },
        }),
      });

      await expect(service.publishPost('Test')).rejects.toMatchObject({
        errorCode: ErrorCode.RATE_LIMIT_EXCEEDED,
      });
    });

    it('should throw RATE_LIMIT_EXCEEDED for code 32', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          error: { code: 32, message: 'Rate limit' },
        }),
      });

      await expect(service.publishPost('Test')).rejects.toMatchObject({
        errorCode: ErrorCode.RATE_LIMIT_EXCEEDED,
      });
    });

    it('should throw FACEBOOK_PUBLISH_ERROR for unknown error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          error: { code: 999, message: 'Unknown error' },
        }),
      });

      await expect(service.publishPost('Test')).rejects.toMatchObject({
        errorCode: ErrorCode.FACEBOOK_PUBLISH_ERROR,
      });
    });

    it('should throw FACEBOOK_PUBLISH_ERROR on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      await expect(service.publishPost('Test')).rejects.toThrow(AppException);
    });

    it('should throw FACEBOOK_PUBLISH_ERROR when response has no id', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      await expect(service.publishPost('Test')).rejects.toMatchObject({
        errorCode: ErrorCode.FACEBOOK_PUBLISH_ERROR,
      });
    });
  });
});
