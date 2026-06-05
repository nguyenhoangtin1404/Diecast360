import { BadRequestException, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import {
  extractClientIp,
  extractLoginEmail,
  extractUserAgent,
  isLoginEndpoint,
  mapLoginFailureReason,
} from './login-audit.helpers';

describe('login-audit.helpers', () => {
  describe('isLoginEndpoint', () => {
    it('matches login path with and without global prefix', () => {
      expect(isLoginEndpoint('/api/v1/auth/login')).toBe(true);
      expect(isLoginEndpoint('/auth/login')).toBe(true);
      expect(isLoginEndpoint('/api/v1/auth/refresh')).toBe(false);
    });
  });

  describe('extractClientIp', () => {
    it('prefers first x-forwarded-for hop', () => {
      expect(
        extractClientIp({
          ip: '127.0.0.1',
          headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
        }),
      ).toBe('203.0.113.1');
    });

    it('falls back to req.ip', () => {
      expect(extractClientIp({ ip: '127.0.0.1', headers: {} })).toBe('127.0.0.1');
    });
  });

  describe('extractUserAgent', () => {
    it('truncates user agent to 512 chars', () => {
      const long = 'a'.repeat(600);
      expect(extractUserAgent({ headers: { 'user-agent': long } })?.length).toBe(512);
    });
  });

  describe('extractLoginEmail', () => {
    it('truncates email to 254 chars', () => {
      const longLocal = `${'a'.repeat(300)}@test.com`;
      expect(extractLoginEmail({ email: longLocal }).length).toBe(254);
    });

    it('returns empty string when email missing', () => {
      expect(extractLoginEmail({})).toBe('');
      expect(extractLoginEmail(null)).toBe('');
    });
  });

  describe('mapLoginFailureReason', () => {
    it('maps throttler, credentials, validation, and internal errors', () => {
      expect(mapLoginFailureReason(new ThrottlerException())).toBe('rate_limited');
      expect(
        mapLoginFailureReason(
          new AppException(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Invalid credentials'),
        ),
      ).toBe('invalid_credentials');
      expect(
        mapLoginFailureReason(
          new AppException(ErrorCode.CAPTCHA_FAILED, 'captcha failed'),
        ),
      ).toBe('captcha_failed');
      expect(mapLoginFailureReason(new BadRequestException('Validation failed'))).toBe(
        'validation_error',
      );
      expect(
        mapLoginFailureReason(
          new AppException(ErrorCode.INTERNAL_SERVER_ERROR, 'boom', [], HttpStatus.INTERNAL_SERVER_ERROR),
        ),
      ).toBe('internal_error');
    });
  });
});
