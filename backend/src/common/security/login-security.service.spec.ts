import { ConfigService } from '@nestjs/config';
import { LoginSecurityService } from './login-security.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppException } from '../exceptions/http-exception.filter';
import { ErrorCode } from '../constants/error-codes';

describe('LoginSecurityService', () => {
  let service: LoginSecurityService;
  let prisma: { user: { update: jest.Mock } };
  let config: { get: jest.Mock };

  beforeEach(() => {
    prisma = { user: { update: jest.fn() } };
    config = {
      get: jest.fn((key: string, def?: number) => {
        const map: Record<string, number> = {
          AUTH_EMAIL_RATE_LIMIT: 3,
          AUTH_EMAIL_RATE_WINDOW_MS: 60_000,
          AUTH_LOCKOUT_THRESHOLD: 3,
          AUTH_LOCKOUT_DURATION_MS: 60_000,
        };
        return map[key] ?? def;
      }),
    };
    service = new LoginSecurityService(
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
    );
  });

  it('should not rate limit before threshold is reached', () => {
    // Record 3 failures (= limit) — should not throw
    service.recordEmailFailedAttempt('a@test.com');
    service.recordEmailFailedAttempt('a@test.com');
    service.recordEmailFailedAttempt('a@test.com');
    expect(() => service.assertEmailRateLimit('a@test.com')).not.toThrow();
  });

  it('should rate limit by email once failure count exceeds threshold', () => {
    // 4 failures with limit=3: count=4 > limit=3 → blocked
    service.recordEmailFailedAttempt('a@test.com');
    service.recordEmailFailedAttempt('a@test.com');
    service.recordEmailFailedAttempt('a@test.com');
    service.recordEmailFailedAttempt('a@test.com');

    try {
      service.assertEmailRateLimit('a@test.com');
      fail('expected to throw');
    } catch (e) {
      expect((e as AppException).errorCode).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
    }
  });

  it('should not rate limit successful logins (assertEmailRateLimit called without prior failures)', () => {
    // Simulates a user who logs in successfully many times — should never be rate-limited
    for (let i = 0; i < 20; i++) {
      expect(() => service.assertEmailRateLimit('b@test.com')).not.toThrow();
    }
  });

  it('should lock account after failed threshold', async () => {
    prisma.user.update
      .mockResolvedValueOnce({ failed_login_count: 3 })
      .mockResolvedValueOnce({});

    const result = await service.recordFailedLogin('user-1');
    expect(result.locked).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledTimes(2);
  });
});
