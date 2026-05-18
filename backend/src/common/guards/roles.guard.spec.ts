import { BadRequestException, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole, ShopRole } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PLATFORM_ROLES_KEY } from '../decorators/platform-roles.decorator';
import { ALLOW_STAFF_WRITE_KEY } from '../decorators/allow-staff-write.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let prisma: { userShopRole: { findMany: jest.Mock }; shop: { findUnique: jest.Mock } };

  type TestRequest = {
    user: unknown;
    method: string;
    tenantAccessVerified?: boolean;
  };

  const createContext = (
    requestUser: unknown,
    method = 'GET',
    requestOverrides: Partial<TestRequest> = {},
  ): ExecutionContext => {
    const request: TestRequest = { user: requestUser, method, ...requestOverrides };

    return {
      getHandler: () => jest.fn(),
      getClass: () => class TestController {},
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  const mockReflector = (
    platformRoles?: PlatformRole[],
    shopRoles?: ShopRole[],
    allowStaffWrite?: boolean,
  ) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === PLATFORM_ROLES_KEY) return platformRoles ?? null;
      if (key === ROLES_KEY) return shopRoles ?? null;
      if (key === ALLOW_STAFF_WRITE_KEY) return allowStaffWrite ?? null;
      return null;
    });
  };

  beforeEach(() => {
    reflector = new Reflector();
    prisma = {
      userShopRole: { findMany: jest.fn() },
      shop: { findUnique: jest.fn().mockResolvedValue({ is_active: true }) },
    };
    guard = new RolesGuard(reflector, prisma as unknown as PrismaService);
    // Clear the static cache between tests to prevent cross-test contamination.
    RolesGuard['shopRolesCache'].clear();
  });

  // ── No metadata ─────────────────────────────────────────────────────────────

  it('allows access when no roles metadata', async () => {
    mockReflector();
    await expect(guard.canActivate(createContext(null))).resolves.toBe(true);
  });

  it('allows access when both role arrays are empty', async () => {
    mockReflector([], []);
    await expect(guard.canActivate(createContext(null))).resolves.toBe(true);
  });

  // ── Platform layer ───────────────────────────────────────────────────────────

  it('allows platform_super user on @PlatformRoles route', async () => {
    mockReflector([PlatformRole.platform_super]);
    const ctx = createContext({ id: 'u1', platform_role: PlatformRole.platform_super });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(prisma.shop.findUnique).not.toHaveBeenCalled();
  });

  it('denies user without platform_role on @PlatformRoles route', async () => {
    mockReflector([PlatformRole.platform_super]);
    const ctx = createContext({ id: 'u1', platform_role: null });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user is missing on platform route', async () => {
    mockReflector([PlatformRole.platform_super]);
    await expect(guard.canActivate(createContext(undefined))).rejects.toThrow(ForbiddenException);
  });

  // ── Legacy @Roles(super_admin) mapped to platform_role ──────────────────────

  it('allows platform_super user on legacy @Roles(super_admin) route', async () => {
    mockReflector(undefined, [ShopRole.super_admin]);
    const ctx = createContext({
      id: 'u1',
      platform_role: PlatformRole.platform_super,
      shop_roles: [],
    });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('denies user without platform_role on legacy @Roles(super_admin) route', async () => {
    mockReflector(undefined, [ShopRole.super_admin]);
    prisma.userShopRole.findMany.mockResolvedValue([]);
    const ctx = createContext({ id: 'u1', platform_role: null });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  // ── Tenant layer ─────────────────────────────────────────────────────────────

  it('allows shop_admin with matching active_shop_id', async () => {
    mockReflector(undefined, [ShopRole.shop_admin]);
    const ctx = createContext({
      id: 'u1',
      active_shop_id: 'shop-a',
      shop_roles: [{ shop_id: 'shop-a', role: ShopRole.shop_admin }],
    });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(prisma.shop.findUnique).toHaveBeenCalledWith({
      where: { id: 'shop-a' },
      select: { is_active: true },
    });
  });

  it('skips shop.is_active lookup when tenant access was already verified upstream', async () => {
    mockReflector(undefined, [ShopRole.shop_admin]);
    const ctx = createContext(
      {
        id: 'u1',
        active_shop_id: 'shop-a',
        shop_roles: [{ shop_id: 'shop-a', role: ShopRole.shop_admin }],
      },
      'GET',
      { tenantAccessVerified: true },
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(prisma.shop.findUnique).not.toHaveBeenCalled();
  });

  it('denies shop_admin when active shop is deactivated (is_active false)', async () => {
    mockReflector(undefined, [ShopRole.shop_admin]);
    prisma.shop.findUnique.mockResolvedValueOnce({ is_active: false });
    const ctx = createContext({
      id: 'u1',
      active_shop_id: 'shop-a',
      shop_roles: [{ shop_id: 'shop-a', role: ShopRole.shop_admin }],
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('denies shop_admin when active shop no longer exists', async () => {
    mockReflector(undefined, [ShopRole.shop_admin]);
    prisma.shop.findUnique.mockResolvedValueOnce(null);
    const ctx = createContext({
      id: 'u1',
      active_shop_id: 'shop-a',
      shop_roles: [{ shop_id: 'shop-a', role: ShopRole.shop_admin }],
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('denies tenant user on mixed platform+tenant route when active shop is inactive', async () => {
    mockReflector([PlatformRole.platform_super], [ShopRole.shop_admin, ShopRole.shop_staff]);
    prisma.shop.findUnique.mockResolvedValueOnce({ is_active: false });
    const ctx = createContext(
      {
        id: 'u1',
        platform_role: null,
        active_shop_id: 'shop-a',
        shop_roles: [{ shop_id: 'shop-a', role: ShopRole.shop_admin }],
      },
      'PATCH',
    );
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('allows platform_super on mixed platform+tenant route without shop.is_active lookup', async () => {
    mockReflector([PlatformRole.platform_super], [ShopRole.shop_admin, ShopRole.shop_staff]);
    const ctx = createContext(
      { id: 'u1', platform_role: PlatformRole.platform_super, active_shop_id: 'shop-a' },
      'PATCH',
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(prisma.shop.findUnique).not.toHaveBeenCalled();
  });

  it('allows legacy super_admin shop row when route requires shop_admin', async () => {
    mockReflector(undefined, [ShopRole.shop_admin, ShopRole.shop_staff]);
    const ctx = createContext({
      id: 'u1',
      active_shop_id: 'shop-a',
      shop_roles: [{ shop_id: 'shop-a', role: ShopRole.super_admin }],
    });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('allows legacy super_admin on POST when route lists shop_admin (full write)', async () => {
    mockReflector(undefined, [ShopRole.shop_admin, ShopRole.shop_staff]);
    const ctx = createContext(
      {
        id: 'u1',
        active_shop_id: 'shop-a',
        shop_roles: [{ shop_id: 'shop-a', role: ShopRole.super_admin }],
      },
      'POST',
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('denies legacy super_admin when route requires shop_staff only', async () => {
    mockReflector(undefined, [ShopRole.shop_staff]);
    const ctx = createContext({
      id: 'u1',
      active_shop_id: 'shop-a',
      shop_roles: [{ shop_id: 'shop-a', role: ShopRole.super_admin }],
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('denies legacy super_admin when membership is for a different shop than active_shop_id', async () => {
    mockReflector(undefined, [ShopRole.shop_admin, ShopRole.shop_staff]);
    const ctx = createContext({
      id: 'u1',
      active_shop_id: 'shop-b',
      shop_roles: [{ shop_id: 'shop-a', role: ShopRole.super_admin }],
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws BadRequestException when active_shop_id is missing for tenant route', async () => {
    mockReflector(undefined, [ShopRole.shop_admin]);
    const ctx = createContext({
      id: 'u1',
      shop_roles: [{ shop_id: 'shop-a', role: ShopRole.shop_admin }],
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
  });

  it('throws ForbiddenException when shop does not match active_shop_id', async () => {
    mockReflector(undefined, [ShopRole.shop_admin]);
    const ctx = createContext({
      id: 'u1',
      active_shop_id: 'shop-b',
      shop_roles: [{ shop_id: 'shop-a', role: ShopRole.shop_admin }],
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('loads roles from DB when shop_roles not on request', async () => {
    mockReflector(undefined, [ShopRole.shop_admin]);
    prisma.userShopRole.findMany.mockResolvedValue([{ shop_id: 'shop-a', role: ShopRole.shop_admin }]);
    const ctx = createContext({ id: 'u1', active_shop_id: 'shop-a' });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(prisma.userShopRole.findMany).toHaveBeenCalledWith({
      where: { user_id: 'u1' },
      select: { shop_id: true, role: true },
    });
  });

  // ── Option C: shop_staff HTTP method enforcement ─────────────────────────────

  it('allows shop_staff on GET tenant route (safe method)', async () => {
    mockReflector(undefined, [ShopRole.shop_admin, ShopRole.shop_staff]);
    const ctx = createContext(
      { id: 'u1', active_shop_id: 'shop-a', shop_roles: [{ shop_id: 'shop-a', role: ShopRole.shop_staff }] },
      'GET',
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('denies shop_staff on POST tenant route (mutating method)', async () => {
    mockReflector(undefined, [ShopRole.shop_admin, ShopRole.shop_staff]);
    const ctx = createContext(
      { id: 'u1', active_shop_id: 'shop-a', shop_roles: [{ shop_id: 'shop-a', role: ShopRole.shop_staff }] },
      'POST',
    );
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('denies shop_staff on PATCH tenant route', async () => {
    mockReflector(undefined, [ShopRole.shop_admin, ShopRole.shop_staff]);
    const ctx = createContext(
      { id: 'u1', active_shop_id: 'shop-a', shop_roles: [{ shop_id: 'shop-a', role: ShopRole.shop_staff }] },
      'PATCH',
    );
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('denies shop_staff on DELETE tenant route', async () => {
    mockReflector(undefined, [ShopRole.shop_admin, ShopRole.shop_staff]);
    const ctx = createContext(
      { id: 'u1', active_shop_id: 'shop-a', shop_roles: [{ shop_id: 'shop-a', role: ShopRole.shop_staff }] },
      'DELETE',
    );
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('allows shop_staff on HEAD tenant route (safe method)', async () => {
    mockReflector(undefined, [ShopRole.shop_admin, ShopRole.shop_staff]);
    const ctx = createContext(
      { id: 'u1', active_shop_id: 'shop-a', shop_roles: [{ shop_id: 'shop-a', role: ShopRole.shop_staff }] },
      'HEAD',
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('allows shop_admin on POST tenant route (full write access)', async () => {
    mockReflector(undefined, [ShopRole.shop_admin, ShopRole.shop_staff]);
    const ctx = createContext(
      { id: 'u1', active_shop_id: 'shop-a', shop_roles: [{ shop_id: 'shop-a', role: ShopRole.shop_admin }] },
      'POST',
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('allows shop_staff on POST when @AllowStaffWrite() is set', async () => {
    mockReflector(undefined, [ShopRole.shop_admin, ShopRole.shop_staff], true);
    const ctx = createContext(
      { id: 'u1', active_shop_id: 'shop-a', shop_roles: [{ shop_id: 'shop-a', role: ShopRole.shop_staff }] },
      'POST',
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('still denies shop_staff on PATCH when @AllowStaffWrite() is NOT set', async () => {
    mockReflector(undefined, [ShopRole.shop_admin, ShopRole.shop_staff], false);
    const ctx = createContext(
      { id: 'u1', active_shop_id: 'shop-a', shop_roles: [{ shop_id: 'shop-a', role: ShopRole.shop_staff }] },
      'PATCH',
    );
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  // ── Metadata key verification ────────────────────────────────────────────────

  it('reads both PLATFORM_ROLES_KEY and ROLES_KEY from metadata', async () => {
    const spy = jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    await guard.canActivate(createContext({}));
    expect(spy).toHaveBeenCalledWith(PLATFORM_ROLES_KEY, expect.any(Array));
    expect(spy).toHaveBeenCalledWith(ROLES_KEY, expect.any(Array));
  });
});
