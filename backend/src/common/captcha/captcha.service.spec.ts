import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '../constants/error-codes';
import { CaptchaService } from './captcha.service';

describe('CaptchaService', () => {
  const config = new Map<string, string>();
  const configService = {
    get: jest.fn((key: string) => config.get(key)),
  } as unknown as ConfigService;

  let service: CaptchaService;

  beforeEach(() => {
    config.clear();
    jest.clearAllMocks();
    service = new CaptchaService(configService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns early when CAPTCHA is disabled', async () => {
    config.set('CAPTCHA_ENABLED', 'false');

    await expect(service.verify(undefined, '127.0.0.1')).resolves.toBeUndefined();
  });

  it('throws when CAPTCHA is enabled but token is missing', async () => {
    config.set('CAPTCHA_ENABLED', 'true');
    config.set('CAPTCHA_PROVIDER', 'cloudflare');
    config.set('CAPTCHA_SECRET_KEY', 'secret');

    await expect(service.verify(undefined)).rejects.toMatchObject({
      errorCode: ErrorCode.CAPTCHA_FAILED,
    });
  });

  it('verifies Cloudflare token successfully', async () => {
    config.set('CAPTCHA_ENABLED', 'true');
    config.set('CAPTCHA_PROVIDER', 'cloudflare');
    config.set('CAPTCHA_SECRET_KEY', 'secret');

    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    await expect(service.verify('token', '127.0.0.1')).resolves.toBeUndefined();
  });

  it('throws when Cloudflare verification endpoint is unreachable', async () => {
    config.set('CAPTCHA_ENABLED', 'true');
    config.set('CAPTCHA_PROVIDER', 'cloudflare');
    config.set('CAPTCHA_SECRET_KEY', 'secret');

    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

    await expect(service.verify('token')).rejects.toMatchObject({
      errorCode: ErrorCode.CAPTCHA_FAILED,
    });
  });

  it('throws when Google action is missing (fail-closed)', async () => {
    config.set('CAPTCHA_ENABLED', 'true');
    config.set('CAPTCHA_PROVIDER', 'google');
    config.set('CAPTCHA_SECRET_KEY', 'secret');
    config.set('CAPTCHA_MIN_SCORE', '0.5');

    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, score: 0.9 }),
    } as Response);

    await expect(service.verify('token')).rejects.toMatchObject({
      errorCode: ErrorCode.CAPTCHA_FAILED,
    });
  });

  it('throws when Google score is below configured threshold', async () => {
    config.set('CAPTCHA_ENABLED', 'true');
    config.set('CAPTCHA_PROVIDER', 'google');
    config.set('CAPTCHA_SECRET_KEY', 'secret');
    config.set('CAPTCHA_MIN_SCORE', '0.8');

    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, action: 'login', score: 0.5 }),
    } as Response);

    await expect(service.verify('token')).rejects.toMatchObject({
      errorCode: ErrorCode.CAPTCHA_FAILED,
    });
  });

  it('accepts Google token when action and score are valid', async () => {
    config.set('CAPTCHA_ENABLED', 'true');
    config.set('CAPTCHA_PROVIDER', 'google');
    config.set('CAPTCHA_SECRET_KEY', 'secret');
    config.set('CAPTCHA_MIN_SCORE', '0.5');

    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, action: 'login', score: 0.9 }),
    } as Response);

    await expect(service.verify('token')).resolves.toBeUndefined();
  });
});
