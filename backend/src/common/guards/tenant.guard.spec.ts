import { BadRequestException, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';
import { PrismaService } from '../prisma/prisma.service';

describe('TenantGuard', () => {
  const prisma = {
    userShopRole: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const guard = new TenantGuard(prisma as unknown as PrismaService);

  const createContext = (request: { user?: unknown } & { tenantId?: string }): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as unknown as ExecutionContext;

  it('throws when user has no active_shop_id and no shop membership', async () => {
    prisma.userShopRole.findFirst.mockResolvedValue(null);
    prisma.userShopRole.findUnique.mockResolvedValue(null);
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
    expect(prisma.userShopRole.findUnique).toHaveBeenCalledWith({
      where: { user_id_shop_id: { user_id: 'u1', shop_id: 'shop-1' } },
      include: { shop: { select: { is_active: true } } },
    });
  });

  it('auto-picks first active shop when JWT has no active_shop_id', async () => {
    prisma.userShopRole.findFirst.mockResolvedValue({ shop_id: 'shop-auto' });
    prisma.userShopRole.findUnique.mockResolvedValue({
      shop: { is_active: true },
    });

    const req = { user: { id: 'u1' } } as {
      user: { id: string; active_shop_id?: string };
      tenantId?: string;
    };

    const ok = await guard.canActivate(createContext(req));
    expect(ok).toBe(true);
    expect(req.tenantId).toBe('shop-auto');
    expect(req.user).toEqual(expect.objectContaining({ active_shop_id: 'shop-auto' }));
  });

  it('throws when active_shop_id does not belong to user', async () => {
    prisma.userShopRole.findUnique.mockResolvedValue(null);

    const req = { user: { id: 'u1', active_shop_id: 'shop-b' } };
    await expect(guard.canActivate(createContext(req))).rejects.toThrow(ForbiddenException);
  });
});
