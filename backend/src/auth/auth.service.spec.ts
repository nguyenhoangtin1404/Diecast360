import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/http-exception.filter';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: Record<string, jest.Mock>;
    refreshToken: Record<string, jest.Mock>;
  };
  let jwtService: { sign: jest.Mock };

  const mockUser = {
    id: 'user-1',
    email: 'admin@test.com',
    password_hash: 'hashed-password',
    full_name: 'Admin User',
    role: 'admin',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-access-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
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

  // ============================================================
  // login
  // ============================================================
  describe('login', () => {
    it('should return tokens and user on successful login', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({ email: 'admin@test.com', password: 'password123' });

      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
      expect(result.user.id).toBe('user-1');
      expect(result.user.email).toBe('admin@test.com');
      expect(result.user.full_name).toBe('Admin User');
      expect(result.user.role).toBe('admin');
    });

    it('should throw if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noone@test.com', password: 'password123' }),
      ).rejects.toThrow(AppException);
    });

    it('should throw if user is inactive', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, is_active: false });

      await expect(
        service.login({ email: 'admin@test.com', password: 'password123' }),
      ).rejects.toThrow(AppException);
    });

    it('should throw if password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(
        service.login({ email: 'admin@test.com', password: 'wrong-password' }),
      ).rejects.toThrow(AppException);
    });
  });

  // ============================================================
  // refreshFromCookie
  // ============================================================
  describe('refreshFromCookie', () => {
    const mockRefreshTokenRecord = {
      id: 'rt-1',
      token_hash: 'hash-value',
      expires_at: new Date(Date.now() + 86400000), // tomorrow
      revoked_at: null,
      user: mockUser,
    };

    it('should rotate tokens and return new access + refresh tokens', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(mockRefreshTokenRecord);
      prisma.refreshToken.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refreshFromCookie('valid-refresh-token');

      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
      // Old token should be revoked
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { revoked_at: expect.any(Date) },
      });
    });

    it('should throw if refresh token not found', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshFromCookie('invalid-token'),
      ).rejects.toThrow(AppException);
    });

    it('should throw if refresh token is expired', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        ...mockRefreshTokenRecord,
        expires_at: new Date(Date.now() - 86400000), // yesterday
      });

      await expect(
        service.refreshFromCookie('expired-token'),
      ).rejects.toThrow(AppException);
    });

    it('should throw if refresh token is revoked', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        ...mockRefreshTokenRecord,
        revoked_at: new Date(),
      });

      await expect(
        service.refreshFromCookie('revoked-token'),
      ).rejects.toThrow(AppException);
    });

    it('should throw if user is inactive', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        ...mockRefreshTokenRecord,
        user: { ...mockUser, is_active: false },
      });

      await expect(
        service.refreshFromCookie('valid-token'),
      ).rejects.toThrow(AppException);
    });
  });

  // ============================================================
  // logoutFromCookie
  // ============================================================
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

  // ============================================================
  // validateUser
  // ============================================================
  describe('validateUser', () => {
    it('should return user data for active user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-1');

      expect(result).toEqual({
        id: 'user-1',
        email: 'admin@test.com',
        full_name: 'Admin User',
        role: 'admin',
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

  // ============================================================
  // calculateExpiresAt (private, tested indirectly via login)
  // ============================================================
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
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      prisma.refreshToken.create.mockResolvedValue({});

      await service.login({ email: 'admin@test.com', password: 'pass' });

      const createCall = prisma.refreshToken.create.mock.calls[0][0];
      const expiresAt = createCall.data.expires_at;
      // Should be ~7 days from now
      const diffMs = expiresAt.getTime() - Date.now();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(6.9);
      expect(diffDays).toBeLessThan(7.1);
    });
  });
});
