import { BadRequestException, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole, ShopRole } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PLATFORM_ROLES_KEY } from '../decorators/platform-roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let prisma: { userShopRole: { findMany: jest.Mock } };

  const createContext = (requestUser: unknown, method = 'GET'): ExecutionContext =>
    ({
      getHandler: () => jest.fn(),
      getClass: () => class TestController {},
      switchToHttp: () => ({
        getRequest: () => ({ user: requestUser, method }),
      }),
    }) as unknown as ExecutionContext;

  const mockReflector = (platformRoles?: PlatformRole[], shopRoles?: ShopRole[]) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === PLATFORM_ROLES_KEY) return platformRoles ?? null;
      if (key === ROLES_KEY) return shopRoles ?? null;
      return null;
    });
  };

  beforeEach(() => {
    reflector = new Reflector();
    prisma = { userShopRole: { findMany: jest.fn() } };
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

  // ── Metadata key verification ────────────────────────────────────────────────

  it('reads both PLATFORM_ROLES_KEY and ROLES_KEY from metadata', async () => {
    const spy = jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    await guard.canActivate(createContext({}));
    expect(spy).toHaveBeenCalledWith(PLATFORM_ROLES_KEY, expect.any(Array));
    expect(spy).toHaveBeenCalledWith(ROLES_KEY, expect.any(Array));
  });
});
