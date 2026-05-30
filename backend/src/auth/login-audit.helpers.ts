import { HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';

export const LOGIN_TRACE_ID_KEY = 'loginTraceId';

export type LoginFailureReason =
  | 'invalid_credentials'
  | 'account_locked'
  | 'captcha_failed'
  | 'validation_error'
  | 'rate_limited'
  | 'internal_error';

export function isLoginEndpoint(path: string | undefined): boolean {
  return typeof path === 'string' && path.endsWith('/auth/login');
}

export function extractClientIp(req: {
  ip?: string;
  headers: Record<string, unknown>;
}): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() || undefined;
  }
  return req.ip;
}

export function extractUserAgent(req: {
  headers: Record<string, unknown>;
}): string | undefined {
  const userAgent = req.headers['user-agent'];
  return typeof userAgent === 'string' ? userAgent.slice(0, 512) : undefined;
}

export function extractLoginEmail(body: unknown): string {
  const raw = (body as Record<string, unknown> | undefined)?.email;
  return typeof raw === 'string' ? raw.slice(0, 254) : '';
}

/**
 * Error codes where AuthService records audit before throwing.
 * Both AUTH_INVALID_CREDENTIALS (user not found / bad password) and
 * AUTH_ACCOUNT_LOCKED (pre-locked via assertAccountNotLocked, and
 * lock-after-bad-password) are now recorded by AuthService before throw.
 */
const AUDITED_BY_SERVICE = new Set<string>([
  ErrorCode.AUTH_INVALID_CREDENTIALS,
  ErrorCode.AUTH_ACCOUNT_LOCKED,
]);

/**
 * Returns true when the interceptor should skip recording audit because
 * AuthService has already written a record with the same trace_id.
 */
export function isAlreadyAuditedByService(error: unknown): boolean {
  return error instanceof AppException && AUDITED_BY_SERVICE.has(error.errorCode);
}

export function mapLoginFailureReason(error: unknown): LoginFailureReason {
  if (error instanceof ThrottlerException) {
    return 'rate_limited';
  }

  if (error instanceof AppException) {
    if (error.errorCode === ErrorCode.AUTH_INVALID_CREDENTIALS) {
      return 'invalid_credentials';
    }
    if (error.errorCode === ErrorCode.AUTH_ACCOUNT_LOCKED) {
      return 'account_locked';
    }
    if (error.errorCode === ErrorCode.RATE_LIMIT_EXCEEDED) {
      return 'rate_limited';
    }
    if (error.errorCode === ErrorCode.CAPTCHA_FAILED) {
      return 'captcha_failed';
    }
    return 'internal_error';
  }

  if (error instanceof HttpException) {
    const status = error.getStatus();
    if (
      status === HttpStatus.BAD_REQUEST ||
      status === HttpStatus.UNPROCESSABLE_ENTITY
    ) {
      return 'validation_error';
    }
  }

  return 'internal_error';
}
