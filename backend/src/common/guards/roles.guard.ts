import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ShopRole } from '../../generated/prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

export interface JwtUserShopRole {
  shop_id: string;
  role: ShopRole;
}

/**
 * RolesGuard — enforces that a request's user has at least one of the required roles.
 *
 * Usage: Apply after JwtAuthGuard.
 * The JwtStrategy.validate() must inject `shop_roles` array into req.user.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<ShopRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    const shopRoles = user?.shop_roles as JwtUserShopRole[] | undefined;
    if (!user || !Array.isArray(shopRoles) || shopRoles.length === 0) {
      throw new ForbiddenException('A role is required to access this resource.');
    }

    const hasRole = shopRoles.some(
      (userRole) => userRole?.role != null && requiredRoles.includes(userRole.role),
    );
    
    if (!hasRole) {
       throw new ForbiddenException(`Access forbidden. Required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
