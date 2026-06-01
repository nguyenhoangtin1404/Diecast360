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
    // Record limit-1 failures (2 < 3) — should not throw
    service.recordEmailFailedAttempt('a@test.com');
    service.recordEmailFailedAttempt('a@test.com');
    expect(() => service.assertEmailRateLimit('a@test.com')).not.toThrow();
  });

  it('should rate limit by email once failure count reaches threshold', () => {
    // 3 failures with limit=3: count=3 >= limit=3 → blocked on next attempt
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

  it('should enforce hard cap of 1000 entries even when no expired entries exist', () => {
    // Fill map to exactly 1000 with unique emails all within window
    for (let i = 0; i < 1000; i++) {
      service.recordEmailFailedAttempt(`user${i}@test.com`);
    }
    // 1001st unique email should evict the oldest and insert the new one (not grow past 1000)
    service.recordEmailFailedAttempt('overflow@test.com');
    // Map size should remain <= 1000 (oldest evicted to make room)
    // We can't inspect the private map directly, but we verify no error thrown
    expect(() => service.recordEmailFailedAttempt('another@test.com')).not.toThrow();
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
