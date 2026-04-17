import { Controller, Post, Get, Body, UseGuards, Request, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
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

  /**
   * Login endpoint - Sets access_token and refresh_token as HttpOnly cookies
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    
    // Set access_token cookie (15 minutes)
    const accessTokenMaxAge = 15 * 60 * 1000; // 15 minutes
    res.cookie('access_token', result.access_token, this.getCookieOptions(accessTokenMaxAge));
    
    // Set refresh_token cookie (7 days)
    const refreshTokenMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    res.cookie('refresh_token', result.refresh_token, {
      ...this.getCookieOptions(refreshTokenMaxAge),
      path: '/api/v1/auth', // Restrict refresh token to auth endpoints only
    });
    
    // Return user info (tokens are in cookies, not in response body for security)
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
  async refresh(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    
    if (!refreshToken) {
      // Clear any stale cookies - user needs to login again
      res.clearCookie('access_token', { path: '/' });
      res.clearCookie('refresh_token', { path: '/api/v1/auth' });
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
    
    return { message: 'Token refreshed successfully' };
  }

  /**
   * Logout endpoint - Clears all auth cookies and revokes refresh token
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
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
  async switchShop(
    @Body() dto: SwitchShopDto,
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.switchShop(req.user.id, dto);

    // Issue new access_token with active_shop_id
    const accessTokenMaxAge = 15 * 60 * 1000; // 15 minutes
    res.cookie('access_token', result.access_token, this.getCookieOptions(accessTokenMaxAge));

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
