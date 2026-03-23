import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma/prisma.service';
import { ErrorCode, AppException } from '../common/exceptions/http-exception.filter';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { SwitchShopDto } from './dto/switch-shop.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || !user.is_active) {
      throw new AppException(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppException(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    };
  }

  async refresh(refreshDto: RefreshDto) {
    return this.refreshFromCookie(refreshDto.refresh_token);
  }

  async logout(logoutDto: LogoutDto) {
    return this.logoutFromCookie(logoutDto.refresh_token);
  }

  /**
   * Refresh tokens using refresh_token from cookie
   * Used by cookie-based authentication flow
   */
  async refreshFromCookie(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    
    const refreshTokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    if (!refreshTokenRecord) {
      throw new AppException(ErrorCode.AUTH_TOKEN_EXPIRED, 'Invalid refresh token');
    }

    if (refreshTokenRecord.revoked_at || refreshTokenRecord.expires_at < new Date()) {
      throw new AppException(ErrorCode.AUTH_TOKEN_EXPIRED, 'Refresh token expired');
    }

    if (!refreshTokenRecord.user.is_active) {
      throw new AppException(ErrorCode.AUTH_FORBIDDEN, 'User is inactive');
    }

    // Revoke old token (token rotation for security)
    await this.prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { revoked_at: new Date() },
    });

    const accessToken = this.generateAccessToken(refreshTokenRecord.user.id);
    const newRefreshToken = await this.generateRefreshToken(refreshTokenRecord.user.id);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  }

  /**
   * Logout using refresh_token from cookie
   * Used by cookie-based authentication flow
   */
  async logoutFromCookie(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    
    await this.prisma.refreshToken.updateMany({
      where: { 
        token_hash: tokenHash,
        revoked_at: null,
      },
      data: { revoked_at: new Date() },
    });

    return {};
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { shop_roles: { select: { shop_id: true, role: true } } },
    });

    if (!user || !user.is_active) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      allowed_shop_ids: user.shop_roles.map((r) => r.shop_id),
    };
  }

  /**
   * Switch active shop context.
   * Validates the user has a role for the requested shop,
   * then issues a new access_token with active_shop_id in the payload.
   */
  async switchShop(userId: string, dto: SwitchShopDto) {
    const shopRole = await this.prisma.userShopRole.findUnique({
      where: { user_id_shop_id: { user_id: userId, shop_id: dto.shop_id } },
      include: { shop: true },
    });

    if (!shopRole || !shopRole.shop.is_active) {
      throw new AppException(
        ErrorCode.AUTH_FORBIDDEN,
        'You do not have access to this shop.',
      );
    }

    const newAccessToken = this.generateAccessToken(userId, dto.shop_id);
    return {
      access_token: newAccessToken,
      active_shop: {
        id: shopRole.shop.id,
        name: shopRole.shop.name,
        slug: shopRole.shop.slug,
        role: shopRole.role,
      },
    };
  }

  private generateAccessToken(userId: string, activeShopId?: string): string {
    const payload: Record<string, unknown> = { sub: userId };
    if (activeShopId) {
      payload.active_shop_id = activeShopId;
    }
    return this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as StringValue,
    });
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
    const expiresAt = this.calculateExpiresAt(expiresIn);

    await this.prisma.refreshToken.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    return token;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private calculateExpiresAt(expiresIn: string): Date {
    const now = new Date();
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // default 7 days
    }

    const value = parseInt(match[1]);
    const unit = match[2];
    let milliseconds = value;

    switch (unit) {
      case 's':
        milliseconds *= 1000;
        break;
      case 'm':
        milliseconds *= 60 * 1000;
        break;
      case 'h':
        milliseconds *= 60 * 60 * 1000;
        break;
      case 'd':
        milliseconds *= 24 * 60 * 60 * 1000;
        break;
    }

    return new Date(now.getTime() + milliseconds);
  }
}

