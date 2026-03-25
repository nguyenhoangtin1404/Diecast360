import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ShopRole } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let prisma: { userShopRole: { findMany: jest.Mock } };

  const createContext = (requestUser: unknown): ExecutionContext =>
    ({
      getHandler: () => jest.fn(),
      getClass: () => class TestController {},
      switchToHttp: () => ({
        getRequest: () => ({ user: requestUser }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    prisma = {
      userShopRole: {
        findMany: jest.fn(),
      },
    };
    guard = new RolesGuard(reflector, prisma as unknown as PrismaService);
  });

  it('allows access when no roles metadata', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    await expect(guard.canActivate(createContext(null))).resolves.toBe(true);
  });

  it('allows access when required roles array is empty', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    await expect(guard.canActivate(createContext(null))).resolves.toBe(true);
  });

  it('throws when user is missing', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ShopRole.super_admin]);
    await expect(guard.canActivate(createContext(undefined))).rejects.toThrow(ForbiddenException);
  });

  it('allows super_admin when already present on request user', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ShopRole.super_admin]);
    const context = createContext({
      id: 'u1',
      shop_roles: [{ shop_id: 's1', role: ShopRole.super_admin }],
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(prisma.userShopRole.findMany).not.toHaveBeenCalled();
  });

  it('loads roles from db when request user has no shop_roles', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ShopRole.super_admin]);
    prisma.userShopRole.findMany.mockResolvedValue([{ shop_id: 's1', role: ShopRole.super_admin }]);

    await expect(guard.canActivate(createContext({ id: 'u1' }))).resolves.toBe(true);
    expect(prisma.userShopRole.findMany).toHaveBeenCalledWith({
      where: { user_id: 'u1' },
      select: { shop_id: true, role: true },
    });
  });

  it('throws when required role is not present after db lookup', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ShopRole.super_admin]);
    prisma.userShopRole.findMany.mockResolvedValue([{ shop_id: 's1', role: ShopRole.shop_admin }]);

    await expect(guard.canActivate(createContext({ id: 'u1' }))).rejects.toThrow(ForbiddenException);
  });

  it('throws when user is super_admin on shop A but active_shop_id is shop B', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ShopRole.super_admin]);
    const context = createContext({
      id: 'u1',
      active_shop_id: 'shop-b',
      shop_roles: [{ shop_id: 'shop-a', role: ShopRole.super_admin }],
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('uses ROLES_KEY when reading metadata', async () => {
    const spy = jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    await guard.canActivate(createContext({}));
    expect(spy).toHaveBeenCalledWith(ROLES_KEY, expect.any(Array));
  });
});
