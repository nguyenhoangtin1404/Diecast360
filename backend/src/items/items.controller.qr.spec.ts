import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { QrService } from './qr.service';

describe('ItemsController – GET :id/qr', () => {
  const itemsService = {} as unknown as ItemsService;

  const qrService = {
    getQrCode: jest.fn(),
  };

  const controller = new ItemsController(itemsService, qrService as unknown as QrService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeReq(protocol = 'https', host = 'api.example.com') {
    return { protocol, get: jest.fn().mockReturnValue(host) } as never;
  }

  it('calls qrService.getQrCode with itemId, tenantId, and gatewayBaseUrl', async () => {
    const qrResult = {
      token: 'abc123def456789a',
      resolve_url: 'https://api.example.com/api/v1/public/qr/abc123def456789a',
      image_data_url: 'data:image/png;base64,MOCK',
    };
    qrService.getQrCode.mockResolvedValue(qrResult);

    const result = await controller.getQrCode('item-1', 'shop-1', makeReq());

    expect(qrService.getQrCode).toHaveBeenCalledWith('item-1', 'shop-1', expect.any(String));
    expect(result).toEqual(qrResult);
  });

  it('uses BACKEND_URL env var when set', async () => {
    const prev = process.env.BACKEND_URL;
    process.env.BACKEND_URL = 'https://custom-backend.example.com';
    qrService.getQrCode.mockResolvedValue({ token: 't', resolve_url: 'u', image_data_url: 'd' });

    await controller.getQrCode('item-1', 'shop-1', makeReq('http', 'localhost:3000'));

    expect(qrService.getQrCode).toHaveBeenCalledWith(
      'item-1',
      'shop-1',
      'https://custom-backend.example.com',
    );
    process.env.BACKEND_URL = prev;
  });

  it('falls back to req.protocol + host when BACKEND_URL is not set', async () => {
    const prev = process.env.BACKEND_URL;
    delete process.env.BACKEND_URL;
    qrService.getQrCode.mockResolvedValue({ token: 't', resolve_url: 'u', image_data_url: 'd' });

    await controller.getQrCode('item-1', 'shop-1', makeReq('http', 'localhost:3000'));

    expect(qrService.getQrCode).toHaveBeenCalledWith('item-1', 'shop-1', 'http://localhost:3000');
    process.env.BACKEND_URL = prev;
  });

  it('propagates error from qrService.getQrCode', async () => {
    const err = new Error('QR service failed');
    qrService.getQrCode.mockRejectedValue(err);

    await expect(controller.getQrCode('item-x', 'shop-1', makeReq())).rejects.toThrow(
      'QR service failed',
    );
  });
});
