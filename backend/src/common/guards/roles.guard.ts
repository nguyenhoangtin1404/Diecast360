import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ShopRole } from '../../generated/prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtUserShopRole {
  shop_id: string;
  role: ShopRole;
}

/**
 * RolesGuard — enforces that a request's user has at least one of the required roles.
 *
 * Usage: Apply after JwtAuthGuard.
 * `JwtStrategy` does not attach `shop_roles` (see AuthService.validateUser). If missing, this guard
 * loads only `{ shop_id, role }` rows — only on routes decorated with `@Roles(...)`, not on every API call.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  // In-process cache to avoid hitting DB on every request for @Roles(...) routes.
  // TTL is intentionally small because roles can change (e.g. user promoted/demoted).
  private readonly shopRolesCache = new Map<
    string,
    { expiresAt: number; shopRoles: JwtUserShopRole[] }
  >();

  private readonly shopRolesCacheTtlMs = 30_000;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ShopRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    if (!user?.id) {
      throw new ForbiddenException('A role is required to access this resource.');
    }

    let shopRoles = user?.shop_roles as JwtUserShopRole[] | undefined;
    if (!Array.isArray(shopRoles) || shopRoles.length === 0) {
      const cached = this.shopRolesCache.get(user.id);
      if (cached && cached.expiresAt > Date.now()) {
        shopRoles = cached.shopRoles;
      } else {
        const rows = await this.prisma.userShopRole.findMany({
          where: { user_id: user.id },
          select: { shop_id: true, role: true },
        });
        shopRoles = rows.map((r) => ({ shop_id: r.shop_id, role: r.role }));
        this.shopRolesCache.set(user.id, {
          expiresAt: Date.now() + this.shopRolesCacheTtlMs,
          shopRoles,
        });
      }

      request.user = {
        ...user,
        shop_roles: shopRoles,
      };
    }

    if (shopRoles.length === 0) {
      throw new ForbiddenException('A role is required to access this resource.');
    }

    const activeShopId = typeof user.active_shop_id === 'string' ? user.active_shop_id : undefined;

    // super_admin is treated as a global permission: it should not depend on `active_shop_id`.
    const hasGlobalSuperAdmin = shopRoles.some(
      (ur) => ur.role === ShopRole.super_admin && requiredRoles.includes(ShopRole.super_admin),
    );
    if (hasGlobalSuperAdmin) {
      return true;
    }

    // If the endpoint requires any non-global role, we must have an active shop context.
    const requiresTenantScopedRole = requiredRoles.some((r) => r !== ShopRole.super_admin);
    if (requiresTenantScopedRole) {
      if (!activeShopId) {
        throw new BadRequestException(
          'Active shop is not selected. Call POST /auth/switch-shop with a shop_id you have access to, then retry.',
        );
      }

      const hasTenantRole = shopRoles.some(
        (userRole) =>
          userRole?.role != null &&
          requiredRoles.includes(userRole.role) &&
          userRole.shop_id === activeShopId,
      );

      if (!hasTenantRole) {
        throw new ForbiddenException(
          `Access forbidden. Required roles: ${requiredRoles.join(', ')}`,
        );
      }

      return true;
    }

    // Only global role(s) were requested but the user doesn't have global super_admin.
    throw new ForbiddenException(`Access forbidden. Required roles: ${requiredRoles.join(', ')}`);
  }
}
