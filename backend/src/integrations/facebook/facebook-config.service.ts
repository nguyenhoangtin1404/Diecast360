import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/exceptions/http-exception.filter';
import { ErrorCode } from '../../common/constants/error-codes';

export interface FacebookConfig {
  pageId: string;
  pageAccessToken: string;
}

@Injectable()
export class FacebookConfigService {
  private readonly logger = new Logger(FacebookConfigService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Check whether Facebook publish is configured.
   * Returns true when both FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN are non-empty.
   */
  isConfigured(): boolean {
    const pageId = this.config.get<string>('FACEBOOK_PAGE_ID', '');
    const token = this.config.get<string>('FACEBOOK_PAGE_ACCESS_TOKEN', '');
    return !!(pageId && token);
  }

  /**
   * Return Facebook config or throw if not configured.
   * Validation happens at request time — not at startup — because FB publish is optional.
   */
  getConfig(): FacebookConfig {
    const pageId = this.config.get<string>('FACEBOOK_PAGE_ID', '');
    const pageAccessToken = this.config.get<string>(
      'FACEBOOK_PAGE_ACCESS_TOKEN',
      '',
    );

    if (!pageId || !pageAccessToken) {
      this.logger.warn(
        'Facebook publish requested but FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN is missing',
      );
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'Facebook integration chưa được cấu hình. Set FACEBOOK_PAGE_ID và FACEBOOK_PAGE_ACCESS_TOKEN.',
      );
    }

    return { pageId, pageAccessToken };
  }
}
