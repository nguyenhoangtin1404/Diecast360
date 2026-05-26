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

  it('should rate limit by email after threshold', () => {
    expect(() => {
      service.assertEmailRateLimit('a@test.com');
      service.assertEmailRateLimit('a@test.com');
      service.assertEmailRateLimit('a@test.com');
      service.assertEmailRateLimit('a@test.com');
    }).toThrow(AppException);
    try {
      service.assertEmailRateLimit('a@test.com');
    } catch (e) {
      expect((e as AppException).errorCode).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
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
