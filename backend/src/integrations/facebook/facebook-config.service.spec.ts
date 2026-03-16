import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FacebookConfigService } from './facebook-config.service';

describe('FacebookConfigService', () => {
  let service: FacebookConfigService;
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    configService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacebookConfigService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<FacebookConfigService>(FacebookConfigService);

    // Suppress logger output during tests
    jest
      .spyOn(
        (service as unknown as { logger: { warn: jest.Mock } }).logger,
        'warn',
      )
      .mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isConfigured', () => {
    it('should return true when both env vars are set', () => {
      configService.get.mockImplementation((key: string, defaultVal: string) => {
        if (key === 'FACEBOOK_PAGE_ID') return 'page-123';
        if (key === 'FACEBOOK_PAGE_ACCESS_TOKEN') return 'token-abc';
        return defaultVal;
      });

      expect(service.isConfigured()).toBe(true);
    });

    it('should return false when FACEBOOK_PAGE_ID is missing', () => {
      configService.get.mockImplementation((key: string, defaultVal: string) => {
        if (key === 'FACEBOOK_PAGE_ID') return '';
        if (key === 'FACEBOOK_PAGE_ACCESS_TOKEN') return 'token-abc';
        return defaultVal;
      });

      expect(service.isConfigured()).toBe(false);
    });

    it('should return false when FACEBOOK_PAGE_ACCESS_TOKEN is missing', () => {
      configService.get.mockImplementation((key: string, defaultVal: string) => {
        if (key === 'FACEBOOK_PAGE_ID') return 'page-123';
        if (key === 'FACEBOOK_PAGE_ACCESS_TOKEN') return '';
        return defaultVal;
      });

      expect(service.isConfigured()).toBe(false);
    });

    it('should return false when both env vars are missing', () => {
      configService.get.mockImplementation((_key: string, defaultVal: string) => defaultVal);

      expect(service.isConfigured()).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return config when both env vars are set', () => {
      configService.get.mockImplementation((key: string, defaultVal: string) => {
        if (key === 'FACEBOOK_PAGE_ID') return 'page-123';
        if (key === 'FACEBOOK_PAGE_ACCESS_TOKEN') return 'token-abc';
        return defaultVal;
      });

      const config = service.getConfig();
      expect(config.pageId).toBe('page-123');
      expect(config.pageAccessToken).toBe('token-abc');
    });

    it('should throw AppException when config is missing', () => {
      configService.get.mockImplementation((_key: string, defaultVal: string) => defaultVal);

      expect(() => service.getConfig()).toThrow('Facebook integration');
    });
  });
});
