import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new BadRequestException(
        'Active shop is not selected. Call POST /auth/switch-shop with a shop_id you have access to, then retry.',
      );
    }

    const rawShop = user.active_shop_id;
    let activeShopId: string | null | undefined =
      typeof rawShop === 'string' && rawShop.trim().length > 0 ? rawShop.trim() : undefined;
    if (!activeShopId) {
      const fallback = await this.prisma.userShopRole.findFirst({
        where: { user_id: user.id, shop: { is_active: true } },
        orderBy: { shop_id: 'asc' },
        select: { shop_id: true },
      });
      activeShopId = fallback?.shop_id ?? null;
      if (activeShopId) {
        request.user = { ...user, active_shop_id: activeShopId };
      }
    }

    if (!activeShopId) {
      throw new BadRequestException(
        'Active shop is not selected. You have no shop membership yet, or no active shop. Ask a super admin to add you to a shop, or call POST /auth/switch-shop once you have access.',
      );
    }

    // Hardening: ensure the selected tenant actually belongs to the user.
    // Prevents JWT forging / replay where attacker provides arbitrary active_shop_id.
    const shopRole = await this.prisma.userShopRole.findUnique({
      where: { user_id_shop_id: { user_id: user.id, shop_id: activeShopId } },
      include: { shop: { select: { is_active: true } } },
    });

    if (!shopRole || !shopRole.shop?.is_active) {
      throw new ForbiddenException('Access forbidden for the selected active shop.');
    }

    // Inject tenantId for downstream use via @CurrentTenantId() decorator
    request.tenantId = activeShopId;
    return true;
  }
}
