import { HttpStatus } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { PublicShopResolverService } from './public-shop-resolver.service';
import { QrService } from '../items/qr.service';
import { QueryPublicItemsDto } from './dto/query-public-items.dto';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';

describe('PublicController', () => {
  const publicService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    getShopContact: jest.fn(),
  };
  const resolver = {
    resolveCanonicalShopId: jest.fn(),
  };

  const qrService = {
    resolveToken: jest.fn(),
  };

  const controller = new PublicController(
    publicService as unknown as PublicService,
    resolver as unknown as PublicShopResolverService,
    qrService as unknown as QrService,
  );

  const prevNodeEnv = process.env.NODE_ENV;

  afterAll(() => {
    process.env.NODE_ENV = prevNodeEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

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

  describe('production public shop scope', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('rejects list when anonymous and no shop in JWT (422 PUBLIC_SHOP_REQUIRED)', async () => {
      resolver.resolveCanonicalShopId.mockResolvedValue(null);
      const req = { user: undefined } as never;

      let caught: unknown;
      try {
        await controller.findAll({} as QueryPublicItemsDto, req);
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(AppException);
      expect((caught as AppException).getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect((caught as AppException).errorCode).toBe(ErrorCode.PUBLIC_SHOP_REQUIRED);
      expect(publicService.findAll).not.toHaveBeenCalled();
    });

    it('allows list when explicit shop_id resolves', async () => {
      resolver.resolveCanonicalShopId.mockResolvedValue('shop-x');
      publicService.findAll.mockResolvedValue({ items: [] });
      const req = { user: undefined } as never;

      await controller.findAll({ shop_id: 'my-slug' } as QueryPublicItemsDto, req);

      expect(publicService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ shop_id: 'my-slug' }),
        'shop-x',
      );
    });

    it('allows list when JWT supplies active_shop_id and query omits shop', async () => {
      resolver.resolveCanonicalShopId.mockResolvedValue(null);
      publicService.findAll.mockResolvedValue({ items: [] });
      const req = { user: { active_shop_id: 'shop-jwt' } } as never;

      await controller.findAll({} as QueryPublicItemsDto, req);

      expect(publicService.findAll).toHaveBeenCalledWith({}, 'shop-jwt');
    });

    it('rejects detail when anonymous and no shop in JWT (422 PUBLIC_SHOP_REQUIRED)', async () => {
      resolver.resolveCanonicalShopId.mockResolvedValue(null);
      const req = { user: undefined } as never;

      let caught: unknown;
      try {
        await controller.findOne('item-1', undefined, req);
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(AppException);
      expect((caught as AppException).getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect((caught as AppException).errorCode).toBe(ErrorCode.PUBLIC_SHOP_REQUIRED);
      expect(publicService.findOne).not.toHaveBeenCalled();
    });

    it('allows detail when explicit shop_id resolves', async () => {
      resolver.resolveCanonicalShopId.mockResolvedValue('shop-x');
      publicService.findOne.mockResolvedValue({ item: {} });
      const req = { user: undefined } as never;

      await controller.findOne('item-1', 'slug', req);

      expect(publicService.findOne).toHaveBeenCalledWith('item-1', 'shop-x');
    });
  });

  it('allows anonymous aggregate in non-production (no tenant)', async () => {
    process.env.NODE_ENV = 'test';
    resolver.resolveCanonicalShopId.mockResolvedValue(null);
    publicService.findAll.mockResolvedValue({ items: [] });
    const req = { user: undefined } as never;

    await controller.findAll({} as QueryPublicItemsDto, req);

    expect(publicService.findAll).toHaveBeenCalledWith({}, null);
  });

  describe('getShopContact', () => {
    it('prefers explicit shop param over JWT', async () => {
      resolver.resolveCanonicalShopId.mockResolvedValue('shop-from-path');
      publicService.getShopContact.mockResolvedValue({ shop: {}, contact: {} });
      const req = { user: { active_shop_id: 'shop-jwt' } } as never;

      const out = await controller.getShopContact('my-slug', req);

      expect(resolver.resolveCanonicalShopId).toHaveBeenCalledWith('my-slug');
      expect(publicService.getShopContact).toHaveBeenCalledWith('shop-from-path');
      expect(out).toEqual({ shop: {}, contact: {} });
    });

    it('rejects in production when anonymous and no shop (422)', async () => {
      const prevEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        resolver.resolveCanonicalShopId.mockResolvedValue(null);
        const req = { user: undefined } as never;

        let caught: unknown;
        try {
          await controller.getShopContact('slug', req);
        } catch (e) {
          caught = e;
        }
        expect(caught).toBeInstanceOf(AppException);
        expect((caught as AppException).errorCode).toBe(ErrorCode.PUBLIC_SHOP_REQUIRED);
        expect(publicService.getShopContact).not.toHaveBeenCalled();
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });
  });
});
