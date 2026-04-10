import { PreOrderStatus } from '../generated/prisma/client';
import { PreordersController } from './preorders.controller';

describe('PreordersController', () => {
  const service = {
    create: jest.fn(),
    update: jest.fn(),
    transitionStatus: jest.fn(),
    findAdminList: jest.fn(),
    getAdminSummary: jest.fn(),
    getCampaignParticipants: jest.fn(),
    findPublicCards: jest.fn(),
    findMyOrders: jest.fn(),
  };
  const controller = new PreordersController(service as never);

  beforeEach(() => jest.clearAllMocks());

  it('maps status transition payload correctly', async () => {
    service.transitionStatus.mockResolvedValue({ preorder: { id: 'po-1' } });
    const result = await controller.transitionStatus(
      'po-1',
      { status: PreOrderStatus.ARRIVED },
      'shop-1',
    );
    expect(result).toEqual({ preorder: { id: 'po-1' } });
    expect(service.transitionStatus).toHaveBeenCalledWith('po-1', PreOrderStatus.ARRIVED, 'shop-1');
  });

  it('passes actor context for create', async () => {
    service.create.mockResolvedValue({ preorder: { id: 'po-1' } });
    const result = await controller.create(
      { item_id: '26fcb08a-76d7-4b2f-aef5-8a6e30a8f2ab', quantity: 1 },
      'shop-1',
      'user-1',
      { user: { role: 'admin' } } as never,
    );
    expect(result).toEqual({ preorder: { id: 'po-1' } });
    expect(service.create).toHaveBeenCalledWith(
      { item_id: '26fcb08a-76d7-4b2f-aef5-8a6e30a8f2ab', quantity: 1 },
      'shop-1',
      { userId: 'user-1', role: 'admin' },
    );
  });

  it('routes public listing with validated query dto', async () => {
    service.findPublicCards.mockResolvedValue({ cards: [] });
    const result = await controller.findPublicCards({
      shop_id: '00000000-0000-0000-0000-000000000001',
      page: 1,
      page_size: 20,
    });
    expect(result).toEqual({ cards: [] });
    expect(service.findPublicCards).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000001',
      expect.objectContaining({ page: 1, page_size: 20 }),
    );
  });
});
