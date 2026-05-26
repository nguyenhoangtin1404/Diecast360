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

    const ok =
      provider === 'google'
        ? await this.verifyGoogle(secret, token, remoteIp)
        : await this.verifyCloudflare(secret, token, remoteIp);

    if (!ok) {
      throw new AppException(ErrorCode.CAPTCHA_FAILED, 'CAPTCHA verification failed');
    }
  }

  private async verifyCloudflare(
    secret: string,
    token: string,
    remoteIp?: string,
  ): Promise<boolean> {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) {
      body.set('remoteip', remoteIp);
    }
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      this.logger.warn(`captcha.cloudflare_http status=${res.status}`);
      return false;
    }
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  }

  private async verifyGoogle(
    secret: string,
    token: string,
    remoteIp?: string,
  ): Promise<boolean> {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) {
      body.set('remoteip', remoteIp);
    }
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      this.logger.warn(`captcha.google_http status=${res.status}`);
      return false;
    }
    const data = (await res.json()) as { success?: boolean; score?: number };
    if (!data.success) {
      return false;
    }
    const minScore = Number(this.config.get<string>('CAPTCHA_MIN_SCORE', '0.5'));
    if (typeof data.score === 'number' && data.score < minScore) {
      return false;
    }
    return true;
  }
}
