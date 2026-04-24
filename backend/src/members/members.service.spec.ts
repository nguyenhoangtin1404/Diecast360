import { Test, TestingModule } from '@nestjs/testing';
import { MemberPointsMutationType } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { MembersService } from './members.service';

describe('MembersService', () => {
  let service: MembersService;
  const prisma = {
    member: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    membershipTier: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    memberPointsLedger: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [MembersService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<MembersService>(MembersService);
  });

  it('adjustPoints always creates ledger record', async () => {
    const tx = {
      member: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'm1',
          shop_id: 'shop-1',
          points_balance: 100,
          tier_id: 'tier-bronze',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'm1',
          points_balance: 150,
          tier: null,
        }),
      },
      membershipTier: {
        findMany: jest.fn().mockResolvedValue([{ id: 'tier-bronze', rank: 1, min_points: 0 }]),
      },
      memberPointsLedger: {
        create: jest.fn().mockResolvedValue({
          id: 'l1',
          delta: 50,
          balance_after: 150,
        }),
      },
    };
    prisma.$transaction.mockImplementation(async (cb: (trx: typeof tx) => Promise<unknown>) => cb(tx));

    const result = await service.adjustPoints(
      'm1',
      {
        type: MemberPointsMutationType.earn,
        points: 50,
        reason: 'Reward',
      },
      'shop-1',
      'user-1',
    );

    expect(tx.member.update).toHaveBeenCalled();
    expect(tx.memberPointsLedger.create).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        ledger: expect.objectContaining({
          id: 'l1',
          balance_after: 150,
        }),
      }),
    );
  });

  it('adjustPoints supports negative adjust and stores absolute points', async () => {
    const tx = {
      member: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'm1',
          shop_id: 'shop-1',
          points_balance: 120,
          tier_id: 'tier-silver',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'm1',
          points_balance: 100,
          tier: null,
        }),
      },
      membershipTier: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'tier-bronze', rank: 1, min_points: 0 },
          { id: 'tier-silver', rank: 2, min_points: 100 },
        ]),
      },
      memberPointsLedger: {
        create: jest.fn().mockResolvedValue({
          id: 'l2',
          points: 20,
          delta: -20,
          balance_after: 100,
        }),
      },
    };
    prisma.$transaction.mockImplementation(async (cb: (trx: typeof tx) => Promise<unknown>) => cb(tx));

    await service.adjustPoints(
      'm1',
      {
        type: MemberPointsMutationType.adjust,
        points: -20,
        reason: 'Manual correction',
      },
      'shop-1',
      'user-1',
    );

    expect(tx.memberPointsLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          points: 20,
          delta: -20,
          balance_after: 100,
        }),
      }),
    );
  });

  it('create/update/delete tier works through prisma', async () => {
    prisma.membershipTier.create.mockResolvedValue({ id: 't1', name: 'Silver', rank: 2, min_points: 1000 });
    prisma.membershipTier.findFirst.mockResolvedValue({ id: 't1' });
    prisma.membershipTier.update.mockResolvedValue({ id: 't1', name: 'Silver+', rank: 2, min_points: 1200 });
    prisma.membershipTier.delete.mockResolvedValue({ id: 't1' });

    const created = await service.createTier('shop-1', { name: 'Silver', rank: 2, min_points: 1000 });
    const updated = await service.updateTier('shop-1', 't1', { name: 'Silver+', min_points: 1200 });
    const deleted = await service.deleteTier('shop-1', 't1');

    expect(created).toEqual(expect.objectContaining({ tier: expect.objectContaining({ id: 't1' }) }));
    expect(updated).toEqual(expect.objectContaining({ tier: expect.objectContaining({ name: 'Silver+' }) }));
    expect(deleted).toEqual({ ok: true });
  });

  it('creates member inside transaction with default tier', async () => {
    const tx = {
      member: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({
          id: 'm3',
          full_name: 'Le Van C',
          email: 'c@example.com',
          phone: null,
          tier: { id: 'tier-bronze' },
        }),
      },
      membershipTier: {
        findFirst: jest.fn().mockResolvedValue({ id: 'tier-bronze' }),
      },
    };
    prisma.$transaction.mockImplementation(async (cb: (trx: typeof tx) => Promise<unknown>) => cb(tx));

    const result = await service.createMember(
      { full_name: 'Le Van C', email: 'c@example.com' },
      'shop-1',
    );

    expect(tx.member.findMany).toHaveBeenCalled();
    expect(tx.member.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          shop_id: 'shop-1',
          full_name: 'Le Van C',
          email: 'c@example.com',
          tier_id: 'tier-bronze',
        }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        member: expect.objectContaining({ id: 'm3' }),
      }),
    );
  });

  it('caches tiers per tenant and invalidates after tier mutation', async () => {
    prisma.membershipTier.findMany.mockResolvedValue([{ id: 't1', name: 'Bronze', rank: 1, min_points: 0 }]);
    prisma.membershipTier.create.mockResolvedValue({ id: 't2', name: 'Silver', rank: 2, min_points: 1000 });

    const first = await service.listTiers('shop-1');
    const second = await service.listTiers('shop-1');
    await service.createTier('shop-1', { name: 'Silver', rank: 2, min_points: 1000 });
    await service.listTiers('shop-1');

    expect(first.tiers).toEqual(second.tiers);
    expect(prisma.membershipTier.findMany).toHaveBeenCalledTimes(2);
    expect(prisma.membershipTier.create).toHaveBeenCalled();
  });

  it('deletes member by id in tenant', async () => {
    prisma.member.findFirst.mockResolvedValue({ id: 'm1' });
    prisma.member.delete.mockResolvedValue({ id: 'm1' });

    const result = await service.deleteMember('m1', 'shop-1');

    expect(prisma.member.findFirst).toHaveBeenCalledWith({
      where: { id: 'm1', shop_id: 'shop-1' },
      select: { id: true },
    });
    expect(prisma.member.delete).toHaveBeenCalledWith({ where: { id: 'm1' } });
    expect(result).toEqual({ ok: true });
  });
});
