import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { Request } from 'express';

/**
 * Custom extractor function that reads JWT from HttpOnly cookie
 * Falls back to Authorization header for backward compatibility
 */
const cookieExtractor = (req: Request): string | null => {
  // First, try to get token from HttpOnly cookie (preferred for security)
  if (req && req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
  }
  
  // Fallback: try to get from Authorization header (for API clients, mobile apps, etc.)
  const authHeader = req?.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET') || 'super-secret';
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string } & Record<string, unknown>) {
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
