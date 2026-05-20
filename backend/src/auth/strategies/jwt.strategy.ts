import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { createAccessTokenExtractor } from './jwt-from-request';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret || secret.trim().length < 32) {
      throw new Error('JWT_SECRET must be set and at least 32 characters long');
    }
    const allowBearer =
      (configService.get<string>('JWT_ALLOW_AUTHORIZATION_BEARER') ?? 'true').trim().toLowerCase() !== 'false';
    super({
      jwtFromRequest: createAccessTokenExtractor(allowBearer),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string; active_shop_id?: string } & Record<string, unknown>) {
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    // Include active_shop_id from JWT payload so TenantGuard can read it
    return {
      ...user,
      active_shop_id: payload.active_shop_id ?? null,
    };
  }
}
