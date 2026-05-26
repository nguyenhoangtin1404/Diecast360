import { Injectable, Logger } from '@nestjs/common';
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
import { CaptchaService } from '../common/security/captcha.service';
import { LoginAuditService } from '../common/security/login-audit.service';
import { LoginSecurityService } from '../common/security/login-security.service';
import { SecurityAlertService } from '../common/security/security-alert.service';

export interface LoginRequestContext {
  traceId: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly captcha: CaptchaService,
    private readonly loginAudit: LoginAuditService,
    private readonly loginSecurity: LoginSecurityService,
    private readonly securityAlerts: SecurityAlertService,
  ) {}

  async login(loginDto: LoginDto, ctx: LoginRequestContext) {
    const email = this.loginSecurity.normalizeEmail(loginDto.email);

    await this.captcha.assertValid(loginDto.captcha_token, ctx.ipAddress);
    this.loginSecurity.assertEmailRateLimit(email);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.is_active) {
      this.logger.warn(`auth.login_failed reason=user_missing_or_inactive email=${email}`);
      this.loginAudit.record({
        traceId: ctx.traceId,
        email,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        status: 'failed',
        failureReason: 'invalid_credentials',
      });
      this.securityAlerts.recordLoginFailed(email);
      throw new AppException(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Invalid credentials');
    }

    await this.loginSecurity.assertAccountNotLocked(user);

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);
    if (!isPasswordValid) {
      this.logger.warn(`auth.login_failed reason=bad_password email=${email}`);
      const { locked } = await this.loginSecurity.recordFailedLogin(user.id);
      this.loginAudit.record({
        traceId: ctx.traceId,
        email,
        userId: user.id,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        status: 'failed',
        failureReason: locked ? 'account_locked' : 'invalid_credentials',
      });
      this.securityAlerts.recordLoginFailed(email);
      if (locked) {
        this.securityAlerts.recordAccountLocked(email);
        const lockMs = Number(process.env.AUTH_LOCKOUT_DURATION_MS || 1_800_000);
        throw new AppException(
          ErrorCode.AUTH_ACCOUNT_LOCKED,
          'Account temporarily locked due to too many failed login attempts. Please try again later.',
          [],
          undefined,
          Math.ceil(lockMs / 1000),
        );
      }
      throw new AppException(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Invalid credentials');
    }

    await this.loginSecurity.recordSuccessfulLogin(user.id);

    const defaultShopId = await this.resolveDefaultShopIdForUser(user.id);
    const accessToken = this.generateAccessToken(user.id, defaultShopId);
    const refreshToken = await this.generateRefreshToken(user.id);

    this.loginAudit.record({
      traceId: ctx.traceId,
      email,
      userId: user.id,
      shopId: defaultShopId ?? null,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      status: 'success',
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      active_shop_id: defaultShopId,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        platform_role: user.platform_role ?? null,
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
  async refreshFromCookie(refreshToken: string, priorAccessToken?: string | null) {
    const tokenHash = this.hashToken(refreshToken);

    // Atomic revocation: only one concurrent request with the same token can win.
    // updateMany with revoked_at: null ensures a second concurrent call gets count=0
    // and is rejected, preventing token rotation bypass via race condition.
    const revoked = await this.prisma.refreshToken.updateMany({
      where: { token_hash: tokenHash, revoked_at: null, expires_at: { gt: new Date() } },
      data: { revoked_at: new Date() },
    });

    if (revoked.count === 0) {
      throw new AppException(ErrorCode.AUTH_TOKEN_EXPIRED, 'Invalid or expired refresh token');
    }

    const refreshTokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    if (!refreshTokenRecord || !refreshTokenRecord.user.is_active) {
      throw new AppException(ErrorCode.AUTH_FORBIDDEN, 'User is inactive');
    }

    const userId = refreshTokenRecord.user.id;
    let shopId = this.parseActiveShopFromAccessJwt(priorAccessToken);
    if (shopId) {
      const role = await this.prisma.userShopRole.findUnique({
        where: { user_id_shop_id: { user_id: userId, shop_id: shopId } },
        include: { shop: { select: { is_active: true } } },
      });
      if (!role?.shop?.is_active) {
        shopId = undefined;
      }
    }
    shopId = shopId ?? (await this.resolveDefaultShopIdForUser(userId));
    const accessToken = this.generateAccessToken(userId, shopId);
    const newRefreshToken = await this.generateRefreshToken(userId);

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

  /**
   * JWT validation only — no `shop_roles` / `shops` join (avoids overhead on every authenticated request).
   * Full tenant payload: {@link getUserTenantAccess} (e.g. GET /auth/me). Per-shop: targeted query in {@link switchShop}.
   * `platform_role` is included so RolesGuard can enforce platform-level access without an extra DB query.
   */
  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, full_name: true, role: true, platform_role: true, is_active: true },
    });

    if (!user || !user.is_active) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      platform_role: user.platform_role,
    };
  }

  /**
   * Load shop memberships + shop summaries — use for GET /auth/me only, not for JwtStrategy.
   * Also returns `platform_role` so frontend can gate platform-only UI.
   */
  async getUserTenantAccess(userId: string) {
    const [roles, user] = await Promise.all([
      this.prisma.userShopRole.findMany({
        where: { user_id: userId },
        include: {
          shop: { select: { id: true, name: true, slug: true, is_active: true } },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { platform_role: true },
      }),
    ]);

    const shop_roles = roles.map((r) => ({
      shop_id: r.shop_id,
      role: r.role,
    }));

    const allowed_shops = roles.map((r) => ({
      id: r.shop.id,
      name: r.shop.name,
      slug: r.shop.slug,
      is_active: r.shop.is_active,
      role: r.role,
    }));

    return {
      platform_role: user?.platform_role ?? null,
      allowed_shop_ids: shop_roles.map((r) => r.shop_id),
      shop_roles,
      allowed_shops,
    };
  }

  /**
   * Switch active shop — loads **one** `user_shop_roles` row (+ shop), not the full role list.
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
        is_active: shopRole.shop.is_active,
        role: shopRole.role,
      },
    };
  }

  /** Decode-only: reuse active_shop_id from the expiring access cookie when rotating refresh (must still validate membership). */
  private parseActiveShopFromAccessJwt(priorAccessToken?: string | null): string | undefined {
    if (!priorAccessToken || typeof priorAccessToken !== 'string') return undefined;
    try {
      const decoded = this.jwtService.decode(priorAccessToken) as { active_shop_id?: unknown } | null;
      const id = decoded?.active_shop_id;
      return typeof id === 'string' && id.length > 0 ? id : undefined;
    } catch {
      return undefined;
    }
  }

  /** First active shop the user belongs to (stable by shop_id). Used when issuing JWT without explicit switch-shop. */
  private async resolveDefaultShopIdForUser(userId: string): Promise<string | undefined> {
    const row = await this.prisma.userShopRole.findFirst({
      where: { user_id: userId, shop: { is_active: true } },
      orderBy: { shop_id: 'asc' },
      select: { shop_id: true },
    });
    return row?.shop_id;
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
