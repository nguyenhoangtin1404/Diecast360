import { Injectable, Logger } from '@nestjs/common';
import { FacebookConfigService } from './facebook-config.service';
import { AppException } from '../../common/exceptions/http-exception.filter';
import { ErrorCode } from '../../common/constants/error-codes';

export interface FacebookPublishResult {
  postId: string;
  postUrl: string;
}

interface GraphApiErrorResponse {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
  };
}

interface GraphApiSuccessResponse {
  id?: string;
}

/** Timeout for Graph API calls in milliseconds. */
const GRAPH_API_TIMEOUT_MS = 10_000;

const GRAPH_API_BASE = 'https://graph.facebook.com';

@Injectable()
export class FacebookGraphService {
  private readonly logger = new Logger(FacebookGraphService.name);

  constructor(private readonly fbConfig: FacebookConfigService) {}

  /**
   * Publish a post to the configured Facebook Page.
   *
   * Calls POST /{page-id}/feed with the given message.
   * Returns the created post ID and constructed post URL.
   */
  async publishPost(message: string): Promise<FacebookPublishResult> {
    const { pageId, pageAccessToken, graphApiVersion } =
      this.fbConfig.getConfig();

    const url = `${GRAPH_API_BASE}/${graphApiVersion}/${pageId}/feed`;

    // Abort controller gives us a deterministic timeout so the request
    // does not hang indefinitely if Facebook is slow or unresponsive.
    const abortController = new AbortController();
    const timeoutId = setTimeout(
      () => abortController.abort(),
      GRAPH_API_TIMEOUT_MS,
    );

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // access_token sent in body (not URL param) intentionally —
        // avoids token leaking into server access logs or proxy caches.
        // Graph API accepts both formats.
        body: JSON.stringify({
          message,
          access_token: pageAccessToken,
        }),
        signal: abortController.signal,
      });
    } catch (error) {
      const isTimeout = (error as Error).name === 'AbortError';
      this.logger.error(
        isTimeout
          ? 'Facebook Graph API request timed out'
          : 'Facebook Graph API network error',
        (error as Error).stack,
      );
      throw new AppException(
        ErrorCode.FACEBOOK_PUBLISH_ERROR,
        isTimeout
          ? 'Facebook API không phản hồi trong thời gian quy định. Vui lòng thử lại.'
          : 'Không thể kết nối tới Facebook. Vui lòng thử lại sau.',
      );
    } finally {
      clearTimeout(timeoutId);
    }

    // Guard against non-JSON responses (e.g. Facebook 503 HTML error pages).
    let body: GraphApiSuccessResponse | GraphApiErrorResponse;
    try {
      body = (await response.json()) as
        | GraphApiSuccessResponse
        | GraphApiErrorResponse;
    } catch {
      this.logger.error(
        `Facebook Graph API returned non-JSON response: status=${response.status}`,
      );
      throw new AppException(
        ErrorCode.FACEBOOK_PUBLISH_ERROR,
        'Facebook trả về response không hợp lệ.',
      );
    }

    if (!response.ok) {
      this.handleGraphApiError(body as GraphApiErrorResponse);
    }

    const successBody = body as GraphApiSuccessResponse;
    if (!successBody.id) {
      throw new AppException(
        ErrorCode.FACEBOOK_PUBLISH_ERROR,
        'Facebook trả về response không hợp lệ.',
      );
    }

    // Graph API returns id as "pageId_postId"
    const postUrl = `https://www.facebook.com/${successBody.id}`;

    return {
      postId: successBody.id,
      postUrl,
    };
  }

  /**
   * Map Graph API error codes to application error codes.
   *
   * See: https://developers.facebook.com/docs/graph-api/guides/error-handling/
   */
  private handleGraphApiError(errorBody: GraphApiErrorResponse): never {
    const err = errorBody.error;
    const code = err?.code;
    const message = err?.message || 'Unknown Facebook error';

    this.logger.error(
      `Facebook Graph API error: code=${code} message=${message}`,
    );

    // Token invalid/expired
    if (code === 190) {
      throw new AppException(
        ErrorCode.FACEBOOK_AUTH_ERROR,
        'Facebook Access Token không hợp lệ hoặc đã hết hạn. Vui lòng cập nhật token.',
      );
    }

    // Permission denied
    if (code === 200) {
      throw new AppException(
        ErrorCode.FACEBOOK_PERMISSION_ERROR,
        'Token không có quyền đăng bài lên Facebook Page. Kiểm tra lại permissions.',
      );
    }

    // Rate limiting
    if (code === 4 || code === 32) {
      throw new AppException(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        'Đã đạt giới hạn gọi Facebook API. Vui lòng thử lại sau.',
      );
    }

    // All other errors
    throw new AppException(
      ErrorCode.FACEBOOK_PUBLISH_ERROR,
      `Lỗi từ Facebook: ${message}`,
    );
  }
}
