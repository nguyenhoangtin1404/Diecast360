import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
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
      const rows = await this.prisma.userShopRole.findMany({
        where: { user_id: user.id },
        select: { shop_id: true, role: true },
      });
      shopRoles = rows.map((r) => ({ shop_id: r.shop_id, role: r.role }));
      request.user = {
        ...user,
        shop_roles: shopRoles,
      };
    }

    if (shopRoles.length === 0) {
      throw new ForbiddenException('A role is required to access this resource.');
    }

    const activeShopId = typeof user.active_shop_id === 'string' ? user.active_shop_id : undefined;
    const hasRole = shopRoles.some((userRole) => {
      if (userRole?.role == null || !requiredRoles.includes(userRole.role)) {
        return false;
      }
      // When a shop context is selected, role must be granted on that exact shop.
      if (activeShopId) {
        return userRole.shop_id === activeShopId;
      }
      return true;
    });
    
    if (!hasRole) {
       throw new ForbiddenException(`Access forbidden. Required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
