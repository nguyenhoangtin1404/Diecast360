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

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);

  constructor(private readonly configService: ConfigService) {}

  async verify(token: string | undefined, remoteIp?: string): Promise<void> {
    if (this.configService.get<string>('CAPTCHA_ENABLED') !== 'true') return;

    if (!token) {
      throw new AppException(ErrorCode.CAPTCHA_FAILED, 'CAPTCHA verification is required');
    }

    const provider = this.configService.get<string>('CAPTCHA_PROVIDER') || 'cloudflare';
    const secretKey = this.configService.get<string>('CAPTCHA_SECRET_KEY');

    if (!secretKey) {
      this.logger.error('CAPTCHA_SECRET_KEY is not configured but CAPTCHA_ENABLED=true');
      throw new AppException(ErrorCode.CAPTCHA_FAILED, 'CAPTCHA is not configured properly');
    }

    if (provider === 'cloudflare') {
      await this.verifyTurnstile(token, secretKey, remoteIp);
    } else if (provider === 'google') {
      await this.verifyRecaptcha(token, secretKey, remoteIp);
    }
  }

  private async verifyTurnstile(token: string, secretKey: string, remoteIp?: string): Promise<void> {
    const body = new URLSearchParams({ secret: secretKey, response: token });
    if (remoteIp) body.append('remoteip', remoteIp);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });

    const data = (await res.json()) as TurnstileResponse;
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

    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body,
    });

    const data = (await res.json()) as RecaptchaResponse;
    const minScore = parseFloat(this.configService.get<string>('CAPTCHA_MIN_SCORE') ?? '0.5');

    if (!data.success || (data.score !== undefined && data.score < minScore)) {
      throw new AppException(
        ErrorCode.CAPTCHA_FAILED,
        'CAPTCHA verification failed',
        data['error-codes'] ?? [],
      );
    }
  }
}
