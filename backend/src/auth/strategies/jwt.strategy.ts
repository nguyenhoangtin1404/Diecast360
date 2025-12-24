import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET') || 'super-secret';
    console.log('[JwtStrategy] JWT Secret:', secret.substring(0, 10) + '...');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    console.log('[JwtStrategy] Validating token, payload.sub:', payload.sub);
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      console.log('[JwtStrategy] User not found or inactive:', payload.sub);
      throw new UnauthorizedException();
    }
    console.log('[JwtStrategy] User validated:', user.email);
    return user;
  }
}

