import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/http-exception.filter';
import { ErrorCode } from '../common/constants/error-codes';
import { CaptchaService } from '../common/security/captcha.service';
import { LoginAuditService } from '../common/security/login-audit.service';
import { LoginSecurityService } from '../common/security/login-security.service';
import { SecurityAlertService } from '../common/security/security-alert.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: Record<string, jest.Mock>;
    refreshToken: Record<string, jest.Mock>;
    userShopRole: Record<string, jest.Mock>;
  };
  let jwtService: { sign: jest.Mock; decode: jest.Mock };
  let loginSecurity: {
    normalizeEmail: jest.Mock;
    assertEmailRateLimit: jest.Mock;
    recordEmailFailedAttempt: jest.Mock;
    assertAccountNotLocked: jest.Mock;
    recordFailedLogin: jest.Mock;
    recordSuccessfulLogin: jest.Mock;
    getLockoutRetryAfterSeconds: jest.Mock;
  };

  const loginCtx = { traceId: '018f0000-0000-7000-8000-000000000001' };

  const mockUser = {
    id: 'user-1',
    email: 'admin@test.com',
    password_hash: 'hashed-password',
    full_name: 'Admin User',
    role: 'admin',
    is_active: true,
    failed_login_count: 0,
    locked_until: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      userShopRole: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-access-token'),
      decode: jest.fn().mockReturnValue(null),
    };

    loginSecurity = {
      normalizeEmail: jest.fn((e: string) => e.trim().toLowerCase()),
      assertEmailRateLimit: jest.fn(),
      recordEmailFailedAttempt: jest.fn(),
      assertAccountNotLocked: jest.fn(),
      recordFailedLogin: jest.fn().mockResolvedValue({ locked: false }),
      recordSuccessfulLogin: jest.fn().mockResolvedValue(undefined),
      getLockoutRetryAfterSeconds: jest.fn().mockReturnValue(1800),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        {
          provide: CaptchaService,
          useValue: { assertValid: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: LoginAuditService,
          useValue: { record: jest.fn() },
        },
        { provide: LoginSecurityService, useValue: loginSecurity },
        {
          provide: SecurityAlertService,
          useValue: {
            recordLoginFailed: jest.fn(),
            recordAccountLocked: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return tokens and user on successful login', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.userShopRole.findFirst.mockResolvedValue({ shop_id: 'shop-default' });

      const result = await service.login(
        { email: 'admin@test.com', password: 'password123' },
        loginCtx,
      );

      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
      expect(result.user.id).toBe('user-1');
      expect(result.user.email).toBe('admin@test.com');
      expect(result.user.full_name).toBe('Admin User');
      expect(result.user.role).toBe('admin');
      expect(loginSecurity.recordSuccessfulLogin).toHaveBeenCalledWith('user-1');
      expect(loginSecurity.recordEmailFailedAttempt).not.toHaveBeenCalled();
    });

    it('should use case-insensitive lookup (Admin@Test.com finds admin@test.com record)', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.userShopRole.findFirst.mockResolvedValue({ shop_id: 'shop-default' });

      await service.login({ email: 'Admin@Test.COM', password: 'password123' }, loginCtx);

      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: { equals: 'Admin@Test.COM', mode: 'insensitive' } },
        }),
      );
    });

    it('should throw if user not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noone@test.com', password: 'password123' }, loginCtx),
      ).rejects.toThrow(AppException);
      expect(loginSecurity.recordEmailFailedAttempt).toHaveBeenCalledWith('noone@test.com');
    });

    it('should throw if user is inactive', async () => {
      prisma.user.findFirst.mockResolvedValue({ ...mockUser, is_active: false });

      await expect(
        service.login({ email: 'admin@test.com', password: 'password123' }, loginCtx),
      ).rejects.toThrow(AppException);
      expect(loginSecurity.recordEmailFailedAttempt).toHaveBeenCalledWith('admin@test.com');
    });

    it('should throw if password is wrong', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(
        service.login({ email: 'admin@test.com', password: 'wrong-password' }, loginCtx),
      ).rejects.toThrow(AppException);
      expect(loginSecurity.recordFailedLogin).toHaveBeenCalledWith('user-1');
      expect(loginSecurity.recordEmailFailedAttempt).toHaveBeenCalledWith('admin@test.com');
    });

    it('should throw AUTH_ACCOUNT_LOCKED when recordFailedLogin locks account', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);
      loginSecurity.recordFailedLogin.mockResolvedValue({ locked: true });

      await expect(
        service.login({ email: 'admin@test.com', password: 'wrong' }, loginCtx),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.AUTH_ACCOUNT_LOCKED,
      });
      expect(loginSecurity.getLockoutRetryAfterSeconds).toHaveBeenCalled();
    });
  });

  describe('refreshFromCookie', () => {
    const mockRefreshTokenRecord = {
      id: 'rt-1',
      token_hash: 'hash-value',
      expires_at: new Date(Date.now() + 86400000),
      revoked_at: new Date(),
      user: mockUser,
    };

    it('should rotate tokens and return new access + refresh tokens', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      prisma.refreshToken.findUnique.mockResolvedValue(mockRefreshTokenRecord);
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.userShopRole.findFirst.mockResolvedValue({ shop_id: 'shop-default' });

      const result = await service.refreshFromCookie('valid-refresh-token');

      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          token_hash: expect.any(String),
          revoked_at: null,
          expires_at: { gt: expect.any(Date) },
        },
        data: { revoked_at: expect.any(Date) },
      });
    });

    it('should throw if refresh token not found or already revoked or expired', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.refreshFromCookie('invalid-token')).rejects.toThrow(AppException);
    });

    it('should throw if second concurrent request races with the same token', async () => {
      prisma.refreshToken.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });
      prisma.refreshToken.findUnique.mockResolvedValue(mockRefreshTokenRecord);
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.userShopRole.findFirst.mockResolvedValue({ shop_id: 'shop-default' });

      await expect(service.refreshFromCookie('token-A')).resolves.toBeDefined();
      await expect(service.refreshFromCookie('token-A')).rejects.toThrow(AppException);
    });

    it('should throw if user is inactive', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      prisma.refreshToken.findUnique.mockResolvedValue({
        ...mockRefreshTokenRecord,
        user: { ...mockUser, is_active: false },
      });

      await expect(service.refreshFromCookie('valid-token')).rejects.toThrow(AppException);
    });
  });

  describe('logoutFromCookie', () => {
    it('should revoke refresh token', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.logoutFromCookie('some-refresh-token');

      expect(result).toEqual({});
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          token_hash: expect.any(String),
          revoked_at: null,
        },
        data: { revoked_at: expect.any(Date) },
      });
    });
  });

  describe('validateUser', () => {
    it('should return user data for active user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-1');

      expect(result).toEqual({
        id: 'user-1',
        email: 'admin@test.com',
        full_name: 'Admin User',
        role: 'admin',
        platform_role: undefined,
      });
    });

    it('should return null if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent');
      expect(result).toBeNull();
    });

    it('should return null if user is inactive', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, is_active: false });

      const result = await service.validateUser('user-1');
      expect(result).toBeNull();
    });
  });

  describe('getUserTenantAccess', () => {
    it('should map user_shop_roles to tenant access payload including platform_role', async () => {
      prisma.userShopRole.findMany.mockResolvedValue([
        {
          shop_id: 'shop-1',
          role: 'shop_admin',
          shop: {
            id: 'shop-1',
            name: 'Shop One',
            slug: 'shop-one',
            is_active: true,
          },
        },
      ]);
      prisma.user.findUnique.mockResolvedValue({ platform_role: 'platform_super' });

      const result = await service.getUserTenantAccess('user-1');

      expect(result).toEqual({
        platform_role: 'platform_super',
        allowed_shop_ids: ['shop-1'],
        shop_roles: [{ shop_id: 'shop-1', role: 'shop_admin' }],
        allowed_shops: [
          {
            id: 'shop-1',
            name: 'Shop One',
            slug: 'shop-one',
            is_active: true,
            role: 'shop_admin',
          },
        ],
      });
      expect(prisma.userShopRole.findMany).toHaveBeenCalledWith({
        where: { user_id: 'user-1' },
        include: {
          shop: { select: { id: true, name: true, slug: true, is_active: true } },
        },
      });
    });

    it('should return platform_role null when user has no platform role', async () => {
      prisma.userShopRole.findMany.mockResolvedValue([]);
      prisma.user.findUnique.mockResolvedValue({ platform_role: null });

      const result = await service.getUserTenantAccess('user-1');

      expect(result.platform_role).toBeNull();
    });
  });

  describe('switchShop', () => {
    it('should issue token when user has role for shop', async () => {
      prisma.userShopRole.findUnique.mockResolvedValue({
        role: 'shop_admin',
        shop: { id: 'shop-1', name: 'S', slug: 's', is_active: true },
      });

      const result = await service.switchShop('user-1', { shop_id: 'shop-1' });

      expect(result.access_token).toBe('mock-access-token');
      expect(result.active_shop).toEqual({
        id: 'shop-1',
        name: 'S',
        slug: 's',
        is_active: true,
        role: 'shop_admin',
      });
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should reject when user has no role for shop', async () => {
      prisma.userShopRole.findUnique.mockResolvedValue(null);

      await expect(service.switchShop('user-1', { shop_id: 'shop-x' })).rejects.toThrow(AppException);
    });

    it('should reject when user has role but shop is inactive', async () => {
      prisma.userShopRole.findUnique.mockResolvedValue({
        role: 'shop_admin',
        shop: { id: 'shop-1', name: 'S', slug: 's', is_active: false },
      });

      await expect(service.switchShop('user-1', { shop_id: 'shop-1' })).rejects.toThrow(AppException);
    });
  });

  describe('calculateExpiresAt (via login token generation)', () => {
    const originalRefreshExpiry = process.env.REFRESH_TOKEN_EXPIRES_IN;

    afterEach(() => {
      if (originalRefreshExpiry === undefined) {
        delete process.env.REFRESH_TOKEN_EXPIRES_IN;
      } else {
        process.env.REFRESH_TOKEN_EXPIRES_IN = originalRefreshExpiry;
      }
    });

    it('should handle days format', async () => {
      process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
      prisma.user.findFirst.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.userShopRole.findFirst.mockResolvedValue({ shop_id: 'shop-default' });

      await service.login({ email: 'admin@test.com', password: 'pass' }, loginCtx);

      const createCall = prisma.refreshToken.create.mock.calls[0][0];
      const expiresAt = createCall.data.expires_at;
      const diffDays = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(6.9);
      expect(diffDays).toBeLessThan(7.1);
    });
  });
});
