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
      'user-3',
    );
    expect(result).toEqual({ preorder: { id: 'po-1' } });
    expect(service.transitionStatus).toHaveBeenCalledWith(
      'po-1',
      PreOrderStatus.ARRIVED,
      'shop-1',
      'user-3',
    );
  });

  it('passes actor context for update', async () => {
    service.update.mockResolvedValue({ preorder: { id: 'po-2' } });
    const result = await controller.update(
      'po-2',
      { note: 'updated' },
      'shop-1',
      'user-2',
      { user: { platform_role: null } } as never,
    );
    expect(result).toEqual({ preorder: { id: 'po-2' } });
    expect(service.update).toHaveBeenCalledWith(
      'po-2',
      { note: 'updated' },
      'shop-1',
      { userId: 'user-2', platformRole: null },
    );
  });

  it('passes actor context for create', async () => {
    service.create.mockResolvedValue({ preorder: { id: 'po-1' } });
    const result = await controller.create(
      {
        item_id: '26fcb08a-76d7-4b2f-aef5-8a6e30a8f2ab',
        member_id: '11111111-1111-1111-1111-111111111111',
        quantity: 1,
      },
      'shop-1',
      'user-1',
      { user: { platform_role: null } } as never,
    );
    expect(result).toEqual({ preorder: { id: 'po-1' } });
    expect(service.create).toHaveBeenCalledWith(
      {
        item_id: '26fcb08a-76d7-4b2f-aef5-8a6e30a8f2ab',
        member_id: '11111111-1111-1111-1111-111111111111',
        quantity: 1,
      },
      'shop-1',
      { userId: 'user-1', platformRole: null },
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

  it('routes participants with query pagination', async () => {
    service.getCampaignParticipants.mockResolvedValue({ participants: [], pagination: { page: 2 } });
    const result = await controller.getParticipants('item-1', 'shop-1', { page: 2, page_size: 10 });
    expect(result).toEqual({ participants: [], pagination: { page: 2 } });
    expect(service.getCampaignParticipants).toHaveBeenCalledWith('item-1', 'shop-1', {
      page: 2,
      page_size: 10,
    });
  });
});
