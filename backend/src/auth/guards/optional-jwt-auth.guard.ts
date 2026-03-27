import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT auth:
 * - If access_token is present and valid: populate req.user (including active_shop_id from JwtStrategy).
 * - If missing: allow anonymous access (req.user is null).
 * - If provided but invalid/expired: return 401 Unauthorized.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(
    err: unknown,
    user: unknown,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (err) throw err;

    if (user) {
      return user as TUser;
    }

    const req = context.switchToHttp().getRequest<{ headers?: Record<string, string | string[] | undefined> }>();
    const authHeader = req?.headers?.authorization;
    const hasAuthHeader =
      typeof authHeader === 'string'
        ? authHeader.trim().length > 0
        : Array.isArray(authHeader)
          ? authHeader.some((v) => typeof v === 'string' && v.trim().length > 0)
          : false;

    if (hasAuthHeader) {
      throw new UnauthorizedException('Invalid or expired access token.');
    }

    return null as TUser;
  }
}

