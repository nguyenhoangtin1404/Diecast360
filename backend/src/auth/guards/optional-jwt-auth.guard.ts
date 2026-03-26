import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT auth:
 * - If access_token is present and valid: populate req.user (including active_shop_id from JwtStrategy).
 * - If missing/invalid: allow request to continue without req.user (anonymous public access).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(
    err: unknown,
    user: unknown,
    _info: unknown,
    _context: ExecutionContext,
  ): TUser {
    if (err) throw err;
    return (user ?? null) as TUser;
  }
}

