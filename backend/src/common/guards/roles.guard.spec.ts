import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ShopRole } from '../../generated/prisma/client';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createContext = (user: unknown): ExecutionContext =>
    ({
      getHandler: () => jest.fn(),
      getClass: () => class TestController {},
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('allows access when no roles metadata', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(createContext(null))).toBe(true);
  });

  it('allows access when required roles array is empty', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    expect(guard.canActivate(createContext(null))).toBe(true);
  });

  it('throws when user has no shop_roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ShopRole.super_admin]);
    expect(() => guard.canActivate(createContext({ id: 'u1' }))).toThrow(ForbiddenException);
  });

  it('allows super_admin when user has matching shop role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ShopRole.super_admin]);
    expect(
      guard.canActivate(
        createContext({
          id: 'u1',
          shop_roles: [{ shop_id: 's1', role: ShopRole.super_admin }],
        }),
      ),
    ).toBe(true);
  });

  it('throws when roles metadata expects super_admin but user is only shop_admin', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([ShopRole.super_admin]);
    expect(() =>
      guard.canActivate(
        createContext({
          id: 'u1',
          shop_roles: [{ shop_id: 's1', role: ShopRole.shop_admin }],
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('uses ROLES_KEY when reading metadata', () => {
    const spy = jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    guard.canActivate(createContext({}));
    expect(spy).toHaveBeenCalledWith(ROLES_KEY, expect.any(Array));
  });
});
