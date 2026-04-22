import { ReportsController } from './reports.controller';

describe('ReportsController', () => {
  const service = {
    getSummary: jest.fn(),
    getTrends: jest.fn(),
  };
  const controller = new ReportsController(service as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes summary range to service', async () => {
    service.getSummary.mockResolvedValue({ summary: { preorder_created_count: 2 } });

    const result = await controller.getSummary('shop-1', { range: '7d' });

    expect(result).toEqual({ summary: { preorder_created_count: 2 } });
    expect(service.getSummary).toHaveBeenCalledWith('shop-1', '7d');
  });

  it('passes trends filters to service', async () => {
    service.getTrends.mockResolvedValue({ bucket: 'week', series: [] });

    const result = await controller.getTrends('shop-1', { range: '90d', bucket: 'week' });

    expect(result).toEqual({ bucket: 'week', series: [] });
    expect(service.getTrends).toHaveBeenCalledWith('shop-1', '90d', 'week');
  });
});
