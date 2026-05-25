import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../exceptions/http-exception.filter';
import { ErrorCode } from '../constants/error-codes';

interface TurnstileResponse {
  success: boolean;
  'error-codes'?: string[];
}

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  'error-codes'?: string[];
}

const VALID_PROVIDERS = ['cloudflare', 'google'] as const;
type Provider = (typeof VALID_PROVIDERS)[number];

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);

  constructor(private readonly configService: ConfigService) {}

  async verify(token: string | undefined, remoteIp?: string): Promise<void> {
    if (this.configService.get<string>('CAPTCHA_ENABLED') !== 'true') return;

    if (!token) {
      throw new AppException(ErrorCode.CAPTCHA_FAILED, 'CAPTCHA verification is required');
    }

    const rawProvider = this.configService.get<string>('CAPTCHA_PROVIDER') || 'cloudflare';
    const secretKey = this.configService.get<string>('CAPTCHA_SECRET_KEY');

    if (!secretKey) {
      this.logger.error('CAPTCHA_SECRET_KEY is not configured but CAPTCHA_ENABLED=true');
      throw new AppException(ErrorCode.CAPTCHA_FAILED, 'CAPTCHA is not configured properly');
    }

    // Fix #1: reject unknown provider values instead of silently passing
    if (!(VALID_PROVIDERS as readonly string[]).includes(rawProvider)) {
      this.logger.error(`Unknown CAPTCHA_PROVIDER value: "${rawProvider}". Must be one of: ${VALID_PROVIDERS.join(', ')}`);
      throw new AppException(ErrorCode.CAPTCHA_FAILED, 'CAPTCHA is not configured properly');
    }

    const provider = rawProvider as Provider;

    if (provider === 'cloudflare') {
      await this.verifyTurnstile(token, secretKey, remoteIp);
    } else {
      await this.verifyRecaptcha(token, secretKey, remoteIp);
    }
  }

  private async verifyTurnstile(token: string, secretKey: string, remoteIp?: string): Promise<void> {
    const body = new URLSearchParams({ secret: secretKey, response: token });
    if (remoteIp) body.append('remoteip', remoteIp);

    // Fix #2: handle network errors gracefully instead of propagating as 500
    let data: TurnstileResponse;
    try {
      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body,
      });
      data = (await res.json()) as TurnstileResponse;
    } catch (err) {
      this.logger.error('Cloudflare Turnstile siteverify unreachable', err instanceof Error ? err.message : String(err));
      throw new AppException(ErrorCode.CAPTCHA_FAILED, 'CAPTCHA service is temporarily unavailable');
    }

    if (!data.success) {
      throw new AppException(
        ErrorCode.CAPTCHA_FAILED,
        'CAPTCHA verification failed',
        data['error-codes'] ?? [],
      );
    }
  }

  private async verifyRecaptcha(token: string, secretKey: string, remoteIp?: string): Promise<void> {
    const body = new URLSearchParams({ secret: secretKey, response: token });
    if (remoteIp) body.append('remoteip', remoteIp);

    // Fix #2: handle network errors gracefully instead of propagating as 500
    let data: RecaptchaResponse;
    try {
      const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        body,
      });
      data = (await res.json()) as RecaptchaResponse;
    } catch (err) {
      this.logger.error('Google reCAPTCHA siteverify unreachable', err instanceof Error ? err.message : String(err));
      throw new AppException(ErrorCode.CAPTCHA_FAILED, 'CAPTCHA service is temporarily unavailable');
    }

    const minScore = parseFloat(this.configService.get<string>('CAPTCHA_MIN_SCORE') ?? '0.5');

    // Fix #3: treat absent score as 0 (fail-safe) instead of skipping the check
    if (!data.success || (data.score ?? 0) < minScore) {
      throw new AppException(
        ErrorCode.CAPTCHA_FAILED,
        'CAPTCHA verification failed',
        data['error-codes'] ?? [],
      );
    }
  }
}
