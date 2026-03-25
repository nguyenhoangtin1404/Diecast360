import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

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
      // Missing tenant context is a client/setup issue (which shop to act on), not role-based denial — use 400.
      throw new BadRequestException(
        'Active shop is not selected. Call POST /auth/switch-shop with a shop_id you have access to, then retry.',
      );
    }

    // Inject tenantId for downstream use via @CurrentTenantId() decorator
    request.tenantId = user.active_shop_id;
    return true;
  }
}
