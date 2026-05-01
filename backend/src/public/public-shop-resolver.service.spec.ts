import { PublicShopResolverService } from './public-shop-resolver.service';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';

describe('PublicShopResolverService', () => {
  let service: PublicShopResolverService;
  const prisma = {
    shop: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PublicShopResolverService(prisma as never);
  });

  it('returns null when shop_id is omitted or blank', async () => {
    await expect(service.resolveCanonicalShopId(undefined)).resolves.toBeNull();
    await expect(service.resolveCanonicalShopId('   ')).resolves.toBeNull();
    expect(prisma.shop.findFirst).not.toHaveBeenCalled();
  });

  it('resolves active shop by UUID', async () => {
    const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    prisma.shop.findFirst.mockResolvedValue({ id });

    await expect(service.resolveCanonicalShopId(id)).resolves.toBe(id);
    expect(prisma.shop.findFirst).toHaveBeenCalledWith({
      where: { id, is_active: true },
      select: { id: true },
    });
  });

  it('resolves active shop by exact slug (case-sensitive)', async () => {
    prisma.shop.findFirst.mockResolvedValue({ id: 'shop-uuid-1' });

    await expect(service.resolveCanonicalShopId('my-store')).resolves.toBe('shop-uuid-1');
    expect(prisma.shop.findFirst).toHaveBeenCalledWith({
      where: { slug: 'my-store', is_active: true },
      select: { id: true },
    });
  });

  it('throws NOT_FOUND for unknown shop', async () => {
    prisma.shop.findFirst.mockResolvedValue(null);

    try {
      await service.resolveCanonicalShopId('nope');
      throw new Error('expected NOT_FOUND');
    } catch (e) {
      if (e instanceof Error && e.message === 'expected NOT_FOUND') {
        throw e;
      }
      expect(e).toBeInstanceOf(AppException);
      expect((e as AppException).errorCode).toBe(ErrorCode.NOT_FOUND);
    }
  });

  it('throws NOT_FOUND when shop is inactive (not returned by query)', async () => {
    prisma.shop.findFirst.mockResolvedValue(null);

    await expect(service.resolveCanonicalShopId('inactive-slug')).rejects.toBeInstanceOf(
      AppException,
    );
  });
});
