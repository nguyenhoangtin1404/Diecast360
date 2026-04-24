import { MemberPointsMutationType } from '../generated/prisma/client';
import { MembersController } from './members.controller';

describe('MembersController', () => {
  const service = {
    listMembers: jest.fn(),
    listTiers: jest.fn(),
    createTier: jest.fn(),
    updateTier: jest.fn(),
    deleteTier: jest.fn(),
    getMember: jest.fn(),
    createMember: jest.fn(),
    updateMember: jest.fn(),
    deleteMember: jest.fn(),
    listLedger: jest.fn(),
    adjustPoints: jest.fn(),
  };
  const controller = new MembersController(service as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes list query to service', async () => {
    service.listMembers.mockResolvedValue({ members: [] });
    const result = await controller.listMembers('shop-1', { page: 1, page_size: 20 });
    expect(result).toEqual({ members: [] });
    expect(service.listMembers).toHaveBeenCalledWith('shop-1', { page: 1, page_size: 20 });
  });

  it('passes adjust payload to service', async () => {
    service.adjustPoints.mockResolvedValue({ ledger: { id: 'l1' } });
    const result = await controller.adjustPoints(
      'member-1',
      { type: MemberPointsMutationType.adjust, points: 50, reason: 'Manual fix' },
      'shop-1',
      'user-1',
    );
    expect(result).toEqual({ ledger: { id: 'l1' } });
    expect(service.adjustPoints).toHaveBeenCalledWith(
      'member-1',
      { type: MemberPointsMutationType.adjust, points: 50, reason: 'Manual fix' },
      'shop-1',
      'user-1',
    );
  });

  it('passes tier create/update/delete payloads to service', async () => {
    service.createTier.mockResolvedValue({ tier: { id: 't1' } });
    service.updateTier.mockResolvedValue({ tier: { id: 't1', name: 'Silver+' } });
    service.deleteTier.mockResolvedValue({ ok: true });

    const createResult = await controller.createTier('shop-1', {
      name: 'Silver',
      rank: 2,
      min_points: 1000,
    });
    const updateResult = await controller.updateTier('shop-1', 't1', {
      name: 'Silver+',
    });
    const deleteResult = await controller.deleteTier('shop-1', 't1');

    expect(createResult).toEqual({ tier: { id: 't1' } });
    expect(updateResult).toEqual({ tier: { id: 't1', name: 'Silver+' } });
    expect(deleteResult).toEqual({ ok: true });
    expect(service.createTier).toHaveBeenCalledWith('shop-1', {
      name: 'Silver',
      rank: 2,
      min_points: 1000,
    });
    expect(service.updateTier).toHaveBeenCalledWith('shop-1', 't1', { name: 'Silver+' });
    expect(service.deleteTier).toHaveBeenCalledWith('shop-1', 't1');
  });

  it('passes member delete payload to service', async () => {
    service.deleteMember.mockResolvedValue({ ok: true });
    const result = await controller.deleteMember('member-1', 'shop-1');
    expect(result).toEqual({ ok: true });
    expect(service.deleteMember).toHaveBeenCalledWith('member-1', 'shop-1');
  });
});
