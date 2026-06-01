import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCode, AppException } from '../exceptions/http-exception.filter';

type CaptchaProvider = 'cloudflare' | 'google';

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return this.config.get<string>('CAPTCHA_ENABLED', 'false').trim().toLowerCase() === 'true';
  }

  async assertValid(token: string | undefined, remoteIp?: string): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }
    if (!token?.trim()) {
      throw new AppException(ErrorCode.CAPTCHA_FAILED, 'CAPTCHA verification required');
    }

    const provider = (this.config.get<string>('CAPTCHA_PROVIDER', 'cloudflare') ||
      'cloudflare') as CaptchaProvider;
    const secret = this.config.get<string>('CAPTCHA_SECRET_KEY', '').trim();
    if (!secret) {
      this.logger.error('CAPTCHA_ENABLED but CAPTCHA_SECRET_KEY is missing');
      throw new AppException(ErrorCode.CAPTCHA_FAILED, 'CAPTCHA is not configured');
    }

    if (provider === 'google') {
      await this.verifyGoogle(secret, token, remoteIp);
    } else {
      await this.verifyCloudflare(secret, token, remoteIp);
    }
  }

  private async verifyCloudflare(
    secret: string,
    token: string,
    remoteIp?: string,
  ): Promise<void> {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) {
      body.set('remoteip', remoteIp);
    }
    let data: { success?: boolean };
    try {
      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        this.logger.error(`captcha.cloudflare_http status=${res.status}`);
        throw new AppException(ErrorCode.CAPTCHA_FAILED, 'CAPTCHA service is temporarily unavailable');
      }
      data = (await res.json()) as { success?: boolean };
    } catch (err) {
      if (err instanceof AppException) throw err;
      this.logger.error('captcha.cloudflare_unreachable', err instanceof Error ? err.message : String(err));
      throw new AppException(ErrorCode.CAPTCHA_FAILED, 'CAPTCHA service is temporarily unavailable');
    }
    if (data.success !== true) {
      throw new AppException(ErrorCode.CAPTCHA_FAILED, 'CAPTCHA verification failed');
    }
  }

  private async verifyGoogle(
    secret: string,
    token: string,
    remoteIp?: string,
  ): Promise<void> {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) {
      body.set('remoteip', remoteIp);
    }
    let data: { success?: boolean; score?: number; action?: string };
    try {
      const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        this.logger.error(`captcha.google_http status=${res.status}`);
        throw new AppException(ErrorCode.CAPTCHA_FAILED, 'CAPTCHA service is temporarily unavailable');
      }
      data = (await res.json()) as { success?: boolean; score?: number; action?: string };
    } catch (err) {
      if (err instanceof AppException) throw err;
      this.logger.error('captcha.google_unreachable', err instanceof Error ? err.message : String(err));
      throw new AppException(ErrorCode.CAPTCHA_FAILED, 'CAPTCHA service is temporarily unavailable');
    }
    // reCAPTCHA v3 tokens must be minted for the expected action.
    // Fail closed when action is missing or mismatched to prevent cross-action token reuse.
    if (data.action !== 'login') {
      throw new AppException(ErrorCode.CAPTCHA_FAILED, 'CAPTCHA verification failed');
    }
    if (!data.success) {
      throw new AppException(ErrorCode.CAPTCHA_FAILED, 'CAPTCHA verification failed');
    }
    const minScore = Number(this.config.get<string>('CAPTCHA_MIN_SCORE', '0.5'));
    if (typeof data.score === 'number' && data.score < minScore) {
      throw new AppException(ErrorCode.CAPTCHA_FAILED, 'CAPTCHA verification failed');
    }
  }
}
