import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * TenantGuard — enforces that a request has an active_shop_id bound in the JWT.
 *
 * Usage: Apply after JwtAuthGuard.
 * The JwtStrategy.validate() must inject `active_shop_id` into req.user.
 * This guard reads req.user.active_shop_id and assigns it to req.tenantId.
 *
 * Note: Items with `shop_id = null` (pre-migration) are invisible to tenant-scoped
 * queries. Run the data migration that assigns every item to a shop before relying
 * on tenant isolation in production.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.active_shop_id) {
      throw new ForbiddenException(
        'No active shop context. Please call POST /auth/switch-shop first.',
      );
    }

    // Inject tenantId for downstream use via @CurrentTenantId() decorator
    request.tenantId = user.active_shop_id;
    return true;
  }
}
