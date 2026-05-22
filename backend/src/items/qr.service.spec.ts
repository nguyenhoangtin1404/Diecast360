import { HttpStatus } from '@nestjs/common';
import { QrService } from './qr.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';

jest.mock('qrcode', () => ({ toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,MOCK') }));

import * as QRCode from 'qrcode';

describe('QrService', () => {
  const ITEM_ID = 'item-abc';
  const TENANT_ID = 'shop-xyz';
  const GATEWAY = 'https://gateway.example.com';
  const FRONTEND = 'https://app.example.com';
  const EXISTING_TOKEN = 'existingtoken1234';

  let prisma: {
    item: {
      findFirst: jest.Mock;
      updateMany: jest.Mock;
      findUnique: jest.Mock;
    };
    shop: {
      findFirst: jest.Mock;
    };
  };
  let service: QrService;

  beforeEach(() => {
    prisma = {
      item: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        findUnique: jest.fn(),
      },
      shop: {
        findFirst: jest.fn(),
      },
    };
    service = new QrService(prisma as unknown as PrismaService);
    (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,MOCK');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getQrCode / getOrCreateToken', () => {
    it('returns existing token without calling updateMany when qr_token is already set', async () => {
      prisma.item.findFirst.mockResolvedValue({ id: ITEM_ID, qr_token: EXISTING_TOKEN });

      const result = await service.getQrCode(ITEM_ID, TENANT_ID, GATEWAY);

      expect(result.token).toBe(EXISTING_TOKEN);
      expect(prisma.item.updateMany).not.toHaveBeenCalled();
    });

    it('generates and stores a new token when qr_token is null and updateMany count=1', async () => {
      prisma.item.findFirst.mockResolvedValue({ id: ITEM_ID, qr_token: null });
      prisma.item.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.getQrCode(ITEM_ID, TENANT_ID, GATEWAY);

      expect(typeof result.token).toBe('string');
      expect(result.token).toHaveLength(16);
      expect(prisma.item.updateMany).toHaveBeenCalledWith({
        where: { id: ITEM_ID, qr_token: null },
        data: { qr_token: result.token },
      });
    });

    it('handles race condition: updateMany count=0, reads winner token from DB', async () => {
      prisma.item.findFirst.mockResolvedValue({ id: ITEM_ID, qr_token: null });
      prisma.item.updateMany.mockResolvedValue({ count: 0 });
      prisma.item.findUnique.mockResolvedValue({ qr_token: 'winner-token-5678' });

      const result = await service.getQrCode(ITEM_ID, TENANT_ID, GATEWAY);

      expect(result.token).toBe('winner-token-5678');
      expect(prisma.item.findUnique).toHaveBeenCalledWith({
        where: { id: ITEM_ID },
        select: { qr_token: true },
      });
    });

    it('retries on P2002 unique violation and succeeds on second attempt', async () => {
      prisma.item.findFirst.mockResolvedValue({ id: ITEM_ID, qr_token: null });
      const p2002 = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
      prisma.item.updateMany
        .mockRejectedValueOnce(p2002)
        .mockResolvedValueOnce({ count: 1 });

      const result = await service.getQrCode(ITEM_ID, TENANT_ID, GATEWAY);

      expect(typeof result.token).toBe('string');
      expect(prisma.item.updateMany).toHaveBeenCalledTimes(2);
    });

    it('throws INTERNAL_SERVER_ERROR after 3 consecutive P2002 failures', async () => {
      prisma.item.findFirst.mockResolvedValue({ id: ITEM_ID, qr_token: null });
      const p2002 = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
      prisma.item.updateMany.mockRejectedValue(p2002);

      let caught: unknown;
      try {
        await service.getQrCode(ITEM_ID, TENANT_ID, GATEWAY);
      } catch (e) {
        caught = e;
      }

      expect(caught).toBeInstanceOf(AppException);
      expect((caught as AppException).errorCode).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
      expect((caught as AppException).getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(prisma.item.updateMany).toHaveBeenCalledTimes(3);
    });

    it('throws NOT_FOUND when item does not belong to tenant', async () => {
      prisma.item.findFirst.mockResolvedValue(null);

      let caught: unknown;
      try {
        await service.getQrCode(ITEM_ID, TENANT_ID, GATEWAY);
      } catch (e) {
        caught = e;
      }

      expect(caught).toBeInstanceOf(AppException);
      expect((caught as AppException).errorCode).toBe(ErrorCode.NOT_FOUND);
      expect((caught as AppException).getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('returns token, resolve_url, and image_data_url with correct shape', async () => {
      prisma.item.findFirst.mockResolvedValue({ id: ITEM_ID, qr_token: EXISTING_TOKEN });

      const result = await service.getQrCode(ITEM_ID, TENANT_ID, GATEWAY);

      expect(result).toEqual({
        token: EXISTING_TOKEN,
        resolve_url: `${GATEWAY}/api/v1/public/qr/${EXISTING_TOKEN}`,
        image_data_url: 'data:image/png;base64,MOCK',
      });
    });

    it('resolve_url includes gatewayBaseUrl + /api/v1/public/qr/ + token', async () => {
      prisma.item.findFirst.mockResolvedValue({ id: ITEM_ID, qr_token: EXISTING_TOKEN });

      const result = await service.getQrCode(ITEM_ID, TENANT_ID, GATEWAY);

      expect(result.resolve_url).toBe(`${GATEWAY}/api/v1/public/qr/${EXISTING_TOKEN}`);
    });
  });

  describe('resolveToken', () => {
    const SHOP_ID = 'shop-111';
    const RESOLVED_ITEM_ID = 'item-999';

    it('returns redirect_url with correct format for valid token', async () => {
      prisma.item.findFirst.mockResolvedValue({ id: RESOLVED_ITEM_ID, shop_id: SHOP_ID });
      prisma.shop.findFirst.mockResolvedValue({ id: SHOP_ID });

      const result = await service.resolveToken(EXISTING_TOKEN, FRONTEND);

      expect(result.redirect_url).toBe(
        `${FRONTEND}/items/${RESOLVED_ITEM_ID}?shop_id=${SHOP_ID}&source=qr&action=view`,
      );
    });

    it('redirect_url contains shop_id, source=qr, and action=view', async () => {
      prisma.item.findFirst.mockResolvedValue({ id: RESOLVED_ITEM_ID, shop_id: SHOP_ID });
      prisma.shop.findFirst.mockResolvedValue({ id: SHOP_ID });

      const result = await service.resolveToken(EXISTING_TOKEN, FRONTEND);

      expect(result.redirect_url).toContain(`shop_id=${SHOP_ID}`);
      expect(result.redirect_url).toContain('source=qr');
      expect(result.redirect_url).toContain('action=view');
    });

    it('throws NOT_FOUND when token not found in DB', async () => {
      prisma.item.findFirst.mockResolvedValue(null);

      let caught: unknown;
      try {
        await service.resolveToken('invalid-token', FRONTEND);
      } catch (e) {
        caught = e;
      }

      expect(caught).toBeInstanceOf(AppException);
      expect((caught as AppException).errorCode).toBe(ErrorCode.NOT_FOUND);
      expect((caught as AppException).getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('throws NOT_FOUND when item.shop_id is null', async () => {
      prisma.item.findFirst.mockResolvedValue({ id: RESOLVED_ITEM_ID, shop_id: null });

      let caught: unknown;
      try {
        await service.resolveToken(EXISTING_TOKEN, FRONTEND);
      } catch (e) {
        caught = e;
      }

      expect(caught).toBeInstanceOf(AppException);
      expect((caught as AppException).errorCode).toBe(ErrorCode.NOT_FOUND);
      expect((caught as AppException).getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(prisma.shop.findFirst).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND when shop is inactive', async () => {
      prisma.item.findFirst.mockResolvedValue({ id: RESOLVED_ITEM_ID, shop_id: SHOP_ID });
      prisma.shop.findFirst.mockResolvedValue(null);

      let caught: unknown;
      try {
        await service.resolveToken(EXISTING_TOKEN, FRONTEND);
      } catch (e) {
        caught = e;
      }

      expect(caught).toBeInstanceOf(AppException);
      expect((caught as AppException).errorCode).toBe(ErrorCode.NOT_FOUND);
      expect((caught as AppException).getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });
});
