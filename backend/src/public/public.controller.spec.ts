import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { PublicShopResolverService } from './public-shop-resolver.service';
import { QueryPublicItemsDto } from './dto/query-public-items.dto';

describe('PublicController', () => {
  const publicService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };
  const resolver = {
    resolveCanonicalShopId: jest.fn(),
  };

  const controller = new PublicController(
    publicService as unknown as PublicService,
    resolver as unknown as PublicShopResolverService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('uses explicit shop_id over JWT active_shop_id for list', async () => {
    resolver.resolveCanonicalShopId.mockResolvedValue('shop-from-query');
    publicService.findAll.mockResolvedValue({ items: [], pagination: {} });

    const req = { user: { active_shop_id: 'shop-from-jwt' } } as never;
    await controller.findAll({} as QueryPublicItemsDto, req);

    expect(publicService.findAll).toHaveBeenCalledWith(
      {},
      'shop-from-query',
    );
  });

  it('falls back to JWT when shop_id query is absent', async () => {
    resolver.resolveCanonicalShopId.mockResolvedValue(null);
    publicService.findAll.mockResolvedValue({ items: [], pagination: {} });

    const req = { user: { active_shop_id: 'shop-jwt' } } as never;
    await controller.findAll({} as QueryPublicItemsDto, req);

    expect(publicService.findAll).toHaveBeenCalledWith({}, 'shop-jwt');
  });

  it('uses explicit shop_id over JWT for detail', async () => {
    resolver.resolveCanonicalShopId.mockResolvedValue('shop-a');
    publicService.findOne.mockResolvedValue({ item: {} });

    const req = { user: { active_shop_id: 'shop-b' } } as never;
    await controller.findOne('item-1', 'my-slug', req);

    expect(resolver.resolveCanonicalShopId).toHaveBeenCalledWith('my-slug');
    expect(publicService.findOne).toHaveBeenCalledWith('item-1', 'shop-a');
  });
});
