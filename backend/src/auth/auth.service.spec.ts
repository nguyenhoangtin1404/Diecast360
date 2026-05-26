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
    assertAccountNotLocked: jest.Mock;
    recordFailedLogin: jest.Mock;
    recordSuccessfulLogin: jest.Mock;
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
      assertAccountNotLocked: jest.fn(),
      recordFailedLogin: jest.fn().mockResolvedValue({ locked: false }),
      recordSuccessfulLogin: jest.fn().mockResolvedValue(undefined),
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
      prisma.user.findUnique.mockResolvedValue(mockUser);
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
      expect(loginSecurity.recordSuccessfulLogin).toHaveBeenCalledWith('user-1');
    });

    it('should throw if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noone@test.com', password: 'password123' }, loginCtx),
      ).rejects.toThrow(AppException);
    });

    it('should throw if user is inactive', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, is_active: false });

      await expect(
        service.login({ email: 'admin@test.com', password: 'password123' }, loginCtx),
      ).rejects.toThrow(AppException);
    });

    it('should throw if password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(
        service.login({ email: 'admin@test.com', password: 'wrong-password' }, loginCtx),
      ).rejects.toThrow(AppException);
      expect(loginSecurity.recordFailedLogin).toHaveBeenCalledWith('user-1');
    });

    it('should throw AUTH_ACCOUNT_LOCKED when recordFailedLogin locks account', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);
      loginSecurity.recordFailedLogin.mockResolvedValue({ locked: true });

      await expect(
        service.login({ email: 'admin@test.com', password: 'wrong' }, loginCtx),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.AUTH_ACCOUNT_LOCKED,
      });
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
    });

    it('should throw if refresh token not found or already revoked or expired', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.refreshFromCookie('invalid-token')).rejects.toThrow(AppException);
    });
  });

  describe('validateUser', () => {
    it('should return user data for active user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-1');

      expect(result?.id).toBe('user-1');
    });
  });
});
