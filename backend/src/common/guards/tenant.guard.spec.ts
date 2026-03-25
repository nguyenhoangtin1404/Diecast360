import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';

describe('TenantGuard', () => {
  const guard = new TenantGuard();

  const createContext = (request: { user?: unknown } & { tenantId?: string }): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as unknown as ExecutionContext;

  it('throws when user has no active_shop_id', () => {
    expect(() =>
      guard.canActivate(createContext({ user: { id: 'u1', shop_roles: [] } })),
    ).toThrow(BadRequestException);
  });

  it('throws when user is missing', () => {
    expect(() => guard.canActivate(createContext({}))).toThrow(BadRequestException);
  });

  it('sets tenantId from JWT-bound active shop', () => {
    const req = { user: { id: 'u1', active_shop_id: 'shop-1' } } as {
      user: { id: string; active_shop_id: string };
      tenantId?: string;
    };
    expect(guard.canActivate(createContext(req))).toBe(true);
    expect(req.tenantId).toBe('shop-1');
  });
});
