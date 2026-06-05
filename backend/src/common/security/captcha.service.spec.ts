import { ConfigService } from '@nestjs/config';
import { CaptchaService } from './captcha.service';
import { AppException } from '../exceptions/http-exception.filter';
import { ErrorCode } from '../constants/error-codes';

async function expectCaptchaFailed(promise: Promise<void>): Promise<AppException> {
  let caught: unknown;
  try { await promise; } catch (e) { caught = e; }
  if (!(caught instanceof AppException)) throw new Error('Expected AppException to be thrown');
  return caught;
}

function makeConfig(overrides: Record<string, string> = {}): ConfigService {
  const map: Record<string, string> = {
    CAPTCHA_ENABLED: 'true',
    CAPTCHA_PROVIDER: 'cloudflare',
    CAPTCHA_SECRET_KEY: 'test-secret',
    CAPTCHA_MIN_SCORE: '0.5',
    ...overrides,
  };
  return {
    get: (key: string, def?: string) => map[key] ?? def,
  } as unknown as ConfigService;
}

describe('CaptchaService', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('disabled', () => {
    it('passes without token when disabled', async () => {
      const svc = new CaptchaService(makeConfig({ CAPTCHA_ENABLED: 'false' }));
      await expect(svc.assertValid(undefined)).resolves.toBeUndefined();
    });
  });

  describe('Cloudflare Turnstile', () => {
    it('passes on success:true', async () => {
      fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
      const svc = new CaptchaService(makeConfig());
      await expect(svc.assertValid('token', '1.2.3.4')).resolves.toBeUndefined();
    });

    it('throws CAPTCHA_FAILED on success:false', async () => {
      fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ success: false }) });
      const svc = new CaptchaService(makeConfig());
      await expect(svc.assertValid('token')).rejects.toMatchObject({
        errorCode: ErrorCode.CAPTCHA_FAILED,
      });
    });

    it('throws service unavailable on HTTP error (fail-closed)', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 503 });
      const svc = new CaptchaService(makeConfig());
      const err = await expectCaptchaFailed(svc.assertValid('token'));
      expect(err.errorCode).toBe(ErrorCode.CAPTCHA_FAILED);
      expect((err as unknown as { message: string }).message).toContain('unavailable');
    });

    it('throws service unavailable on network error (fail-closed)', async () => {
      fetchSpy.mockRejectedValue(new TypeError('network error'));
      const svc = new CaptchaService(makeConfig());
      const err = await expectCaptchaFailed(svc.assertValid('token'));
      expect(err.errorCode).toBe(ErrorCode.CAPTCHA_FAILED);
      expect((err as unknown as { message: string }).message).toContain('unavailable');
    });
  });

  describe('Google reCAPTCHA v3', () => {
    const googleConfig = makeConfig({ CAPTCHA_PROVIDER: 'google' });

    it('passes on success:true, action:login, score >= minScore', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, action: 'login', score: 0.9 }),
      });
      const svc = new CaptchaService(googleConfig);
      await expect(svc.assertValid('token')).resolves.toBeUndefined();
    });

    it('throws on wrong action (cross-action token reuse)', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, action: 'signup', score: 0.9 }),
      });
      const svc = new CaptchaService(googleConfig);
      await expect(svc.assertValid('token')).rejects.toMatchObject({
        errorCode: ErrorCode.CAPTCHA_FAILED,
      });
    });

    it('throws when score is below minScore', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, action: 'login', score: 0.2 }),
      });
      const svc = new CaptchaService(googleConfig);
      await expect(svc.assertValid('token')).rejects.toMatchObject({
        errorCode: ErrorCode.CAPTCHA_FAILED,
      });
    });

    it('treats absent score as 0 (fail-closed) when minScore > 0', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, action: 'login' }),
      });
      const svc = new CaptchaService(googleConfig);
      await expect(svc.assertValid('token')).rejects.toMatchObject({
        errorCode: ErrorCode.CAPTCHA_FAILED,
      });
    });

    it('throws service unavailable on HTTP error (fail-closed)', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 429 });
      const svc = new CaptchaService(googleConfig);
      const err = await expectCaptchaFailed(svc.assertValid('token'));
      expect(err.errorCode).toBe(ErrorCode.CAPTCHA_FAILED);
      expect((err as unknown as { message: string }).message).toContain('unavailable');
    });

    it('throws service unavailable on network error (fail-closed)', async () => {
      fetchSpy.mockRejectedValue(new TypeError('network error'));
      const svc = new CaptchaService(googleConfig);
      const err = await expectCaptchaFailed(svc.assertValid('token'));
      expect(err.errorCode).toBe(ErrorCode.CAPTCHA_FAILED);
      expect((err as unknown as { message: string }).message).toContain('unavailable');
    });
  });

  describe('missing token / misconfigured', () => {
    it('throws when token is empty', async () => {
      const svc = new CaptchaService(makeConfig());
      await expect(svc.assertValid('  ')).rejects.toMatchObject({
        errorCode: ErrorCode.CAPTCHA_FAILED,
      });
    });

    it('throws when secret key is missing', async () => {
      const svc = new CaptchaService(makeConfig({ CAPTCHA_SECRET_KEY: '' }));
      await expect(svc.assertValid('token')).rejects.toMatchObject({
        errorCode: ErrorCode.CAPTCHA_FAILED,
      });
    });
  });
});
