import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole, ShopRole } from '../../generated/prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PLATFORM_ROLES_KEY } from '../decorators/platform-roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtUserShopRole {
  shop_id: string;
  role: ShopRole;
}

/**
 * HTTP methods considered safe/read-only for shop_staff enforcement (Option C).
 *
 * All controllers that include shop_staff in @Roles(...) use this set for
 * enforcement at the guard level. There are no non-standard HTTP verbs in
 * this codebase — all routes use the standard NestJS method decorators
 * (@Get, @Post, @Patch, @Delete, @Put) which map 1:1 to HTTP methods.
 * WebSocket / SSE / RPC routes do not use RolesGuard.
 *
 * Audit of @Roles(super_admin) usages NOT migrated to @PlatformRoles:
 * None remain. All former @Roles(super_admin) routes have been converted:
 *   - ShopsController    → @PlatformRoles(platform_super)  (class-level)
 *   - CategoriesController → @PlatformRoles(platform_super) (per-route)
 * Any new route using @Roles(ShopRole.super_admin) will be handled by the
 * platform-role branch of this guard (see "Legacy compatibility" below).
 */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * RolesGuard — dual-layer authorization guard.
 *
 * ## Platform layer (@PlatformRoles decorator)
 * Routes decorated with `@PlatformRoles(PlatformRole.platform_super)` require the user
 * to have `User.platform_role === platform_super`. No shop context is needed.
 * This replaces the old `@Roles(ShopRole.super_admin)` global shortcut.
 *
 * ## Tenant layer (@Roles decorator)
 * Routes decorated with `@Roles(ShopRole.shop_admin)` (or shop_staff) require:
 *   1. A valid `active_shop_id` in the JWT.
 *   2. A matching `UserShopRole` row for that shop.
 *   3. Option C: `shop_staff` users are automatically restricted to safe HTTP methods
 *      (GET/HEAD/OPTIONS) — no individual controller needs to check this.
 *
 * ## Legacy compatibility
 * Routes still using `@Roles(ShopRole.super_admin)` without `@PlatformRoles` are
 * handled by checking `platform_role` first (strict — backfill in migration 15-01
 * already assigned platform_role to all former super_admin users).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  // Static (process-wide) cache shared across all RolesGuard instances.
  // NestJS creates one guard instance per controller when @UseGuards(RolesGuard) is used
  // directly on a controller class — a per-instance cache would not be invalidatable.
  // TTL is intentionally small because roles can change (e.g. user promoted/demoted).
  private static readonly shopRolesCache = new Map<
    string,
    { expiresAt: number; shopRoles: JwtUserShopRole[] }
  >();

  private static readonly shopRolesCacheTtlMs = 30_000;

  /** Invalidate cached shop roles for a user after role mutations. */
  static invalidateShopRolesCache(userId: string): void {
    RolesGuard.shopRolesCache.delete(userId);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const platformRoles = this.reflector.getAllAndOverride<PlatformRole[]>(PLATFORM_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredRoles = this.reflector.getAllAndOverride<ShopRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No authorization metadata — open route.
    if ((!platformRoles || platformRoles.length === 0) && (!requiredRoles || requiredRoles.length === 0)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    if (!user?.id) {
      throw new ForbiddenException('A role is required to access this resource.');
    }

    // ── Platform layer ───────────────────────────────────────────────────────
    // `user.platform_role` is populated by AuthService.validateUser() which runs a
    // fresh DB query on every authenticated request (JwtStrategy.validate → validateUser).
    // It is NOT cached in the JWT token itself, so role changes take effect on the
    // very next request without requiring a token refresh or re-login.
    const requiresPlatform =
      (platformRoles && platformRoles.length > 0) ||
      (requiredRoles && requiredRoles.includes(ShopRole.super_admin));

    if (requiresPlatform) {
      const userPlatformRole = user.platform_role as PlatformRole | null | undefined;
      if (userPlatformRole === PlatformRole.platform_super) {
        return true;
      }
      // If only platform was required, deny immediately.
      const onlyPlatformRequired =
        !requiredRoles ||
        requiredRoles.length === 0 ||
        requiredRoles.every((r) => r === ShopRole.super_admin);
      if (onlyPlatformRequired) {
        throw new ForbiddenException('Platform operator access required.');
      }
      // Fall through to tenant layer if route also accepts tenant roles.
    }

    // ── Tenant layer ─────────────────────────────────────────────────────────
    const tenantRoles = (requiredRoles || []).filter((r) => r !== ShopRole.super_admin);
    if (tenantRoles.length === 0) {
      // Only platform roles were requested and user didn't pass the platform check above.
      throw new ForbiddenException('Platform operator access required.');
    }

    // Load shop roles (from request or cache).
    let shopRoles = user?.shop_roles as JwtUserShopRole[] | undefined;
    if (!Array.isArray(shopRoles) || shopRoles.length === 0) {
      const cached = RolesGuard.shopRolesCache.get(user.id);
      if (cached && cached.expiresAt > Date.now()) {
        shopRoles = cached.shopRoles;
      } else {
        const rows = await this.prisma.userShopRole.findMany({
          where: { user_id: user.id },
          select: { shop_id: true, role: true },
        });
        shopRoles = rows.map((r) => ({ shop_id: r.shop_id, role: r.role }));
        RolesGuard.shopRolesCache.set(user.id, {
          expiresAt: Date.now() + RolesGuard.shopRolesCacheTtlMs,
          shopRoles,
        });
      }

      request.user = { ...user, shop_roles: shopRoles };
    }

    if (!shopRoles || shopRoles.length === 0) {
      throw new ForbiddenException('A role is required to access this resource.');
    }

    const activeShopId = typeof user.active_shop_id === 'string' ? user.active_shop_id : undefined;
    if (!activeShopId) {
      throw new BadRequestException(
        'Active shop is not selected. Call POST /auth/switch-shop with a shop_id you have access to, then retry.',
      );
    }

    const matchingRole = shopRoles.find(
      (ur) => ur?.role != null && (tenantRoles as ShopRole[]).includes(ur.role) && ur.shop_id === activeShopId,
    );

    if (!matchingRole) {
      throw new ForbiddenException(`Access forbidden. Required roles: ${tenantRoles.join(', ')}`);
    }

    // ── Option C: shop_staff HTTP-method enforcement ─────────────────────────
    // shop_staff is read-only. Deny any mutating method globally without needing
    // per-controller checks. To allow a specific write for staff in the future,
    // add an @AllowStaffWrite() escape-hatch decorator.
    if (matchingRole.role === ShopRole.shop_staff) {
      const method: string = request.method?.toUpperCase() ?? '';
      if (!SAFE_METHODS.has(method)) {
        throw new ForbiddenException('Shop staff accounts are read-only and cannot perform this action.');
      }
    }

    return true;
  }
}
