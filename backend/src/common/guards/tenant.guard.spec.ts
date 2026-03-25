import { BadRequestException, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('TenantGuard', () => {
  const prisma = {
    userShopRole: {
      findUnique: jest.fn(),
    },
  };

  const guard = new TenantGuard(prisma as unknown as PrismaService);

  const createContext = (request: { user?: unknown } & { tenantId?: string }): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as unknown as ExecutionContext;

  it('throws when user has no active_shop_id', async () => {
    await expect(
      guard.canActivate(createContext({ user: { id: 'u1', shop_roles: [] } })),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws when user is missing', async () => {
    await expect(guard.canActivate(createContext({}))).rejects.toThrow(BadRequestException);
  });

  it('sets tenantId from JWT-bound active shop', async () => {
    prisma.userShopRole.findUnique.mockResolvedValue({
      shop: { is_active: true },
    });

    const req = { user: { id: 'u1', active_shop_id: 'shop-1' } } as {
      user: { id: string; active_shop_id: string };
      tenantId?: string;
    };

    const ok = await guard.canActivate(createContext(req));
    expect(ok).toBe(true);
    expect(req.tenantId).toBe('shop-1');
  });

  it('throws when active_shop_id does not belong to user', async () => {
    prisma.userShopRole.findUnique.mockResolvedValue(null);

    const req = { user: { id: 'u1', active_shop_id: 'shop-b' } };
    await expect(guard.canActivate(createContext(req))).rejects.toThrow(ForbiddenException);
  });
});
