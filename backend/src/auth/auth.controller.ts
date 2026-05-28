import { Controller, Post, Get, Body, UseGuards, UseInterceptors, Request, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import * as crypto from 'crypto';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginAuditService } from './login-audit.service';
import { LoginAuditInterceptor } from './login-audit.interceptor';
import { LOGIN_TRACE_ID_KEY, extractClientIp, extractUserAgent } from './login-audit.helpers';
import { createLoginTraceId } from './login-trace-id';
import { LoginDto } from './dto/login.dto';
import { SwitchShopDto } from './dto/switch-shop.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

// Cookie configuration interface
interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  maxAge: number;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly loginAuditService: LoginAuditService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get cookie options based on environment configuration
   * Production: secure=true, sameSite=strict for maximum security
   * Development: secure=false, sameSite=lax for easier testing
   */
  private getCookieOptions(maxAgeMs: number): CookieOptions {
    const isSecure = this.configService.get('COOKIE_SECURE') === 'true';
    const sameSite = (this.configService.get('COOKIE_SAME_SITE') || 'lax') as 'lax' | 'strict' | 'none';
    
    return {
      httpOnly: true,           // Prevent XSS - JavaScript cannot access this cookie
      secure: isSecure,         // HTTPS only in production
      sameSite: sameSite,       // CSRF protection
      path: '/',                // Cookie valid for entire domain
      maxAge: maxAgeMs,
    };
  }

  /** Readable CSRF cookie for double-submit pattern (paired with X-CSRF-Token header). */
  private getCsrfCookieOptions(maxAgeMs = 7 * 24 * 60 * 60 * 1000): CookieOptions {
    const isSecure = this.configService.get('COOKIE_SECURE') === 'true';
    const sameSite = (this.configService.get('COOKIE_SAME_SITE') || 'lax') as 'lax' | 'strict' | 'none';
    return {
      httpOnly: false,
      secure: isSecure,
      sameSite,
      path: '/',
      maxAge: maxAgeMs,
    };
  }

  private issueCsrfCookie(res: Response): string {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('csrf_token', token, this.getCsrfCookieOptions());
    return token;
  }

  private clearCsrfCookie(res: Response): void {
    res.clearCookie('csrf_token', {
      path: '/',
      httpOnly: false,
      secure: this.configService.get('COOKIE_SECURE') === 'true',
      sameSite: (this.configService.get('COOKIE_SAME_SITE') || 'lax') as 'lax' | 'strict' | 'none',
    });
  }

  /**
   * Issue or rotate CSRF token (GET — safe method, not blocked by CSRF middleware).
   */
  @Get('csrf')
  @HttpCode(HttpStatus.OK)
  getCsrf(@Res({ passthrough: true }) res: Response) {
    const csrf_token = this.issueCsrfCookie(res);
    return { csrf_token };
  }

  /**
   * Login endpoint - Sets access_token and refresh_token as HttpOnly cookies
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 8 } })
  @UseInterceptors(LoginAuditInterceptor)
  async login(
    @Body() loginDto: LoginDto,
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const hasTraceId = typeof req[LOGIN_TRACE_ID_KEY] === 'string' && req[LOGIN_TRACE_ID_KEY].length > 0;
    const traceId = hasTraceId ? req[LOGIN_TRACE_ID_KEY] : createLoginTraceId();
    if (!hasTraceId) {
      res.setHeader('X-Trace-Id', traceId);
    }
    const ip = extractClientIp(req);
    const userAgent = extractUserAgent(req);

    const result = await this.authService.login(loginDto);

    this.loginAuditService.record({
      trace_id: traceId,
      user_id: result.user.id,
      email: result.user.email,
      shop_id: result.active_shop_id,
      ip_address: ip,
      user_agent: userAgent,
      status: 'success',
    });

    // Set access_token cookie (15 minutes)
    const accessTokenMaxAge = 15 * 60 * 1000;
    res.cookie('access_token', result.access_token, this.getCookieOptions(accessTokenMaxAge));

    // Set refresh_token cookie (7 days)
    const refreshTokenMaxAge = 7 * 24 * 60 * 60 * 1000;
    res.cookie('refresh_token', result.refresh_token, {
      ...this.getCookieOptions(refreshTokenMaxAge),
      path: '/api/v1/auth',
    });

    this.issueCsrfCookie(res);

    return {
      user: result.user,
      message: 'Login successful',
    };
  }

  /**
   * Refresh endpoint - Reads refresh_token from cookie, issues new tokens
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 25 } })
  async refresh(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    
    if (!refreshToken) {
      // Clear any stale cookies - user needs to login again
      res.clearCookie('access_token', { path: '/' });
      res.clearCookie('refresh_token', { path: '/api/v1/auth' });
      this.clearCsrfCookie(res);
      // Return 401 to trigger login redirect
      return res.status(401).json({
        ok: false,
        error: { code: 'AUTH_TOKEN_EXPIRED', details: [] },
        message: 'No refresh token found. Please login again.',
      });
    }
    
    const priorAccess = req.cookies?.access_token as string | undefined;
    const result = await this.authService.refreshFromCookie(refreshToken, priorAccess);
    
    // Set new access_token cookie
    const accessTokenMaxAge = 15 * 60 * 1000;
    res.cookie('access_token', result.access_token, this.getCookieOptions(accessTokenMaxAge));
    
    // Set new refresh_token cookie
    const refreshTokenMaxAge = 7 * 24 * 60 * 60 * 1000;
    res.cookie('refresh_token', result.refresh_token, {
      ...this.getCookieOptions(refreshTokenMaxAge),
      path: '/api/v1/auth',
    });

    this.issueCsrfCookie(res);

    return { message: 'Token refreshed successfully' };
  }

  /**
   * Logout endpoint - Clears all auth cookies and revokes refresh token
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 40 } })
  async logout(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    
    if (refreshToken) {
      await this.authService.logoutFromCookie(refreshToken);
    }
    
    // Clear cookies
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/v1/auth' });
    this.clearCsrfCookie(res);

    return { message: 'Logout successful' };
  }

  /**
   * Switch active shop context.
   * Issues a new access_token cookie with active_shop_id embedded in JWT payload.
   * User must have a user_shop_roles record for the requested shop.
   */
  @Post('switch-shop')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  async switchShop(
    @Body() dto: SwitchShopDto,
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.switchShop(req.user.id, dto);

    // Issue new access_token with active_shop_id
    const accessTokenMaxAge = 15 * 60 * 1000; // 15 minutes
    res.cookie('access_token', result.access_token, this.getCookieOptions(accessTokenMaxAge));

    this.issueCsrfCookie(res);

    return {
      active_shop: result.active_shop,
      message: 'Shop context switched successfully',
    };
  }

  /**
   * Profile + tenant payload: merges minimal JWT user with {@link AuthService.getUserTenantAccess}.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req) {
    const access = await this.authService.getUserTenantAccess(req.user.id);
    return {
      user: {
        ...req.user,
        ...access,
      },
    };
  }
}
