import { Test, TestingModule } from '@nestjs/testing';
import { ShopsService } from './shops.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/http-exception.filter';
import { ShopRole } from '../generated/prisma/client';
import { AddShopAdminDto } from './dto/add-shop-admin.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('ShopsService', () => {
  let service: ShopsService;
  let prisma: {
    shop: Record<string, jest.Mock>;
    item: Record<string, jest.Mock>;
    user: Record<string, jest.Mock>;
    userShopRole: Record<string, jest.Mock>;
    shopAuditLog: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      shop: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      item: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userShopRole: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
      },
      shopAuditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(async (arg: unknown) => {
      if (typeof arg === 'function') {
        return (arg as (tx: typeof prisma) => unknown)(prisma);
      }
      return arg;
    });

    (bcrypt.hash as unknown as jest.Mock).mockResolvedValue('hashed-password');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopsService,
        { provide: PrismaService, useValue: prisma },
        { provide: 'IStorageService', useValue: { getFileUrl: (p: string) => p } },
      ],
    }).compile();

    service = module.get<ShopsService>(ShopsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addShopAdmin', () => {
    const shopId = 'shop-1';
    const userId = '11111111-1111-4111-8111-111111111111';

    it('should throw NOT_FOUND when shop does not exist', async () => {
      prisma.shop.findUnique.mockResolvedValue(null);

      const dto: AddShopAdminDto = { user_id: userId };

      await expect(service.addShopAdmin(shopId, dto)).rejects.toThrow(AppException);
      expect(prisma.shop.findUnique).toHaveBeenCalled();
    });

    it('should throw NOT_FOUND when user does not exist', async () => {
      prisma.shop.findUnique.mockResolvedValue({ id: shopId });
      prisma.user.findUnique.mockResolvedValue(null);

      const dto: AddShopAdminDto = { user_id: userId };

      await expect(service.addShopAdmin(shopId, dto)).rejects.toThrow(AppException);
      expect(prisma.userShopRole.upsert).not.toHaveBeenCalled();
    });

    it('should create user when adding by email and user does not exist (password provided)', async () => {
      prisma.shop.findUnique.mockResolvedValue({ id: shopId });
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: userId });
      prisma.userShopRole.upsert.mockResolvedValue({
        user_id: userId,
        shop_id: shopId,
        role: ShopRole.shop_admin,
      });

      const dto: AddShopAdminDto = {
        email: 'new-user@test.com',
        password: 'password123',
        full_name: 'New User',
      };

      await service.addShopAdmin(shopId, dto);

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new-user@test.com',
          password_hash: 'hashed-password',
          full_name: 'New User',
        },
      });
      expect(prisma.userShopRole.upsert).toHaveBeenCalled();
    });

    it('should upsert userShopRole with role=shop_admin by user_id', async () => {
      prisma.shop.findUnique.mockResolvedValue({ id: shopId });
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.userShopRole.upsert.mockResolvedValue({
        user_id: userId,
        shop_id: shopId,
        role: ShopRole.shop_admin,
      });

      const dto: AddShopAdminDto = { user_id: userId };

      const result = await service.addShopAdmin(shopId, dto);

      expect(result.role).toBe(ShopRole.shop_admin);
      expect(prisma.userShopRole.upsert).toHaveBeenCalledWith({
        where: { user_id_shop_id: { user_id: userId, shop_id: shopId } },
        create: { user_id: userId, shop_id: shopId, role: ShopRole.shop_admin },
        update: { role: ShopRole.shop_admin },
      });
    });

    it('should upsert userShopRole with role=shop_admin by email', async () => {
      prisma.shop.findUnique.mockResolvedValue({ id: shopId });
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.userShopRole.upsert.mockResolvedValue({
        user_id: userId,
        shop_id: shopId,
        role: ShopRole.shop_admin,
      });

      const dto: AddShopAdminDto = { email: 'user@test.com' };

      await service.addShopAdmin(shopId, dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'user@test.com' } });
      expect(prisma.userShopRole.upsert).toHaveBeenCalledWith({
        where: { user_id_shop_id: { user_id: userId, shop_id: shopId } },
        create: { user_id: userId, shop_id: shopId, role: ShopRole.shop_admin },
        update: { role: ShopRole.shop_admin },
      });
    });

    it('should add existing user by email without password', async () => {
      prisma.shop.findUnique.mockResolvedValue({ id: shopId });
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.userShopRole.upsert.mockResolvedValue({
        user_id: userId,
        shop_id: shopId,
        role: ShopRole.shop_admin,
      });

      await service.addShopAdmin(shopId, { email: 'existing@test.com' });

      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.userShopRole.upsert).toHaveBeenCalled();
    });

    it('should assign shop_staff role when dto.role is shop_staff', async () => {
      prisma.shop.findUnique.mockResolvedValue({ id: shopId });
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.userShopRole.upsert.mockResolvedValue({
        user_id: userId,
        shop_id: shopId,
        role: ShopRole.shop_staff,
      });
      prisma.shopAuditLog.create.mockResolvedValue({});

      const dto: AddShopAdminDto = { user_id: userId, role: ShopRole.shop_staff };
      const result = await service.addShopAdmin(shopId, dto);

      expect(result.role).toBe(ShopRole.shop_staff);
      expect(prisma.userShopRole.upsert).toHaveBeenCalledWith({
        where: { user_id_shop_id: { user_id: userId, shop_id: shopId } },
        create: { user_id: userId, shop_id: shopId, role: ShopRole.shop_staff },
        update: { role: ShopRole.shop_staff },
      });
    });

    it('should default to shop_admin when dto.role is omitted', async () => {
      prisma.shop.findUnique.mockResolvedValue({ id: shopId });
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.userShopRole.upsert.mockResolvedValue({
        user_id: userId,
        shop_id: shopId,
        role: ShopRole.shop_admin,
      });
      prisma.shopAuditLog.create.mockResolvedValue({});

      const dto: AddShopAdminDto = { user_id: userId };
      await service.addShopAdmin(shopId, dto);

      expect(prisma.userShopRole.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ role: ShopRole.shop_admin }),
          update: { role: ShopRole.shop_admin },
        }),
      );
    });

    it('should invalidate the RolesGuard cache for the affected user after role upsert', async () => {
      prisma.shop.findUnique.mockResolvedValue({ id: shopId });
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.userShopRole.upsert.mockResolvedValue({
        user_id: userId,
        shop_id: shopId,
        role: ShopRole.shop_staff,
      });
      prisma.shopAuditLog.create.mockResolvedValue({});

      // Pre-populate the shared cache to confirm it is cleared after addShopAdmin.
      RolesGuard['shopRolesCache'].set(userId, {
        expiresAt: Date.now() + 30_000,
        shopRoles: [{ shop_id: shopId, role: ShopRole.shop_admin }],
      });

      await service.addShopAdmin(shopId, { user_id: userId, role: ShopRole.shop_staff });

      expect(RolesGuard['shopRolesCache'].has(userId)).toBe(false);
    });

    it('should use set_shop_member_role audit action when assigning role', async () => {
      prisma.shop.findUnique.mockResolvedValue({ id: shopId });
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.userShopRole.upsert.mockResolvedValue({
        user_id: userId,
        shop_id: shopId,
        role: ShopRole.shop_staff,
      });
      prisma.shopAuditLog.create.mockResolvedValue({});

      await service.addShopAdmin(shopId, { user_id: userId, role: ShopRole.shop_staff }, 'actor-1');

      expect(prisma.shopAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'set_shop_member_role',
            actor_user_id: 'actor-1',
          }),
        }),
      );
    });

    it('should create new user with shop_staff role and use set_shop_member_role audit action', async () => {
      prisma.shop.findUnique.mockResolvedValue({ id: shopId });
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user-id' });
      prisma.userShopRole.upsert.mockResolvedValue({
        user_id: 'new-user-id',
        shop_id: shopId,
        role: ShopRole.shop_staff,
      });

      const dto: AddShopAdminDto = {
        email: 'staff@test.com',
        password: 'password123',
        role: ShopRole.shop_staff,
      };

      await service.addShopAdmin(shopId, dto);

      expect(prisma.userShopRole.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ role: ShopRole.shop_staff }),
        }),
      );
    });
  });

  describe('resetMemberPassword', () => {
    const shopId = 'shop-1';
    const memberUserId = 'user-1';

    it('should throw NOT_FOUND when shop does not exist', async () => {
      prisma.shop.findUnique.mockResolvedValue(null);

      await expect(
        service.resetMemberPassword(shopId, memberUserId, 'newPass123!'),
      ).rejects.toThrow(AppException);
      expect(prisma.userShopRole.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NOT_FOUND when user is not a member', async () => {
      prisma.shop.findUnique.mockResolvedValue({
        id: shopId,
        _count: { items: 0, user_roles: 0 },
      });
      prisma.userShopRole.findUnique.mockResolvedValue(null);

      await expect(
        service.resetMemberPassword(shopId, memberUserId, 'newPass123!'),
      ).rejects.toThrow(AppException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should hash and update password when membership exists', async () => {
      prisma.shop.findUnique.mockResolvedValue({
        id: shopId,
        _count: { items: 0, user_roles: 1 },
      });
      prisma.userShopRole.findUnique.mockResolvedValue({
        user_id: memberUserId,
        shop_id: shopId,
        role: ShopRole.shop_admin,
      });
      prisma.user.update.mockResolvedValue({ id: memberUserId });

      const result = await service.resetMemberPassword(
        shopId,
        memberUserId,
        'newPass123!',
      );

      expect(result).toEqual({ updated: true });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: memberUserId },
        data: { password_hash: 'hashed-password' },
      });
    });
  });

  describe('setMemberAccountActive', () => {
    const shopId = 'shop-1';
    const memberUserId = 'user-1';

    it('should throw NOT_FOUND when shop does not exist', async () => {
      prisma.shop.findUnique.mockResolvedValue(null);

      await expect(
        service.setMemberAccountActive(shopId, memberUserId, false),
      ).rejects.toThrow(AppException);
      expect(prisma.userShopRole.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NOT_FOUND when user is not a member', async () => {
      prisma.shop.findUnique.mockResolvedValue({
        id: shopId,
        _count: { items: 0, user_roles: 0 },
      });
      prisma.userShopRole.findUnique.mockResolvedValue(null);

      await expect(
        service.setMemberAccountActive(shopId, memberUserId, true),
      ).rejects.toThrow(AppException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should set user is_active', async () => {
      prisma.shop.findUnique.mockResolvedValue({
        id: shopId,
        _count: { items: 0, user_roles: 1 },
      });
      prisma.userShopRole.findUnique.mockResolvedValue({
        user_id: memberUserId,
        shop_id: shopId,
        role: ShopRole.shop_admin,
      });
      prisma.user.update.mockResolvedValue({ id: memberUserId });

      await service.setMemberAccountActive(shopId, memberUserId, false);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: memberUserId },
        data: { is_active: false },
      });
    });
  });

  describe('findAuditLogs', () => {
    const shopId = 'shop-1';

    it('should return paginated audit logs', async () => {
      prisma.shop.findUnique.mockResolvedValue({
        id: shopId,
        _count: { items: 0, user_roles: 1 },
      });
      prisma.$transaction.mockResolvedValue([
        [
          {
            id: 'log-1',
            action: 'update_shop',
            target_type: 'shop',
            target_id: shopId,
            metadata_json: JSON.stringify({ after: { name: 'Shop A' } }),
            created_at: new Date('2026-01-01T00:00:00.000Z'),
            actor: { id: 'u1', email: 'admin@test.com', full_name: 'Admin' },
          },
        ],
        1,
      ]);

      const result = await service.findAuditLogs(shopId, {
        page: 1,
        page_size: 20,
      });

      expect(result.logs).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.logs[0].metadata).toEqual({ after: { name: 'Shop A' } });
    });

    it('should apply action filter when provided', async () => {
      prisma.shop.findUnique.mockResolvedValue({
        id: shopId,
        _count: { items: 0, user_roles: 1 },
      });
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAuditLogs(shopId, {
        page: 1,
        page_size: 20,
        action: 'deactivate_shop',
      });

      expect(prisma.shopAuditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { shop_id: shopId, action: 'deactivate_shop' },
        }),
      );
      expect(prisma.shopAuditLog.count).toHaveBeenCalledWith({
        where: { shop_id: shopId, action: 'deactivate_shop' },
      });
    });
  });

  describe('findItems', () => {
    const shopId = 'shop-1';

    it('should search items by keyword', async () => {
      prisma.shop.findUnique.mockResolvedValue({
        id: shopId,
        _count: { items: 0, user_roles: 1 },
      });
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findItems(shopId, {
        page: 1,
        page_size: 20,
        q: 'Ferrari',
      });

      expect(prisma.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            shop_id: shopId,
            deleted_at: null,
            name: { contains: 'Ferrari', mode: 'insensitive' },
          }),
        }),
      );
      expect(prisma.item.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'Ferrari', mode: 'insensitive' },
          }),
        }),
      );
    });
  });

  describe('update/deactivate audit actions', () => {
    const shopId = 'shop-1';

    it('should log deactivate_shop when update changes is_active to false', async () => {
      prisma.shop.findUnique.mockResolvedValue({
        id: shopId,
        name: 'Shop A',
        slug: 'shop-a',
        is_active: true,
        _count: { items: 0, user_roles: 1 },
      });
      prisma.shop.update.mockResolvedValue({
        id: shopId,
        name: 'Shop A',
        slug: 'shop-a',
        is_active: false,
      });
      prisma.shopAuditLog.create.mockResolvedValue({ id: 'log-1' });

      await service.update(shopId, { is_active: false }, 'actor-1');

      expect(prisma.shopAuditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'deactivate_shop',
            shop_id: shopId,
            actor_user_id: 'actor-1',
          }),
        }),
      );
    });

    it('should log deactivate_shop in both deactivate() and update({is_active:false}) paths', async () => {
      prisma.shop.findUnique.mockResolvedValue({
        id: shopId,
        name: 'Shop A',
        slug: 'shop-a',
        is_active: true,
        _count: { items: 0, user_roles: 1 },
      });
      prisma.shop.update.mockResolvedValue({
        id: shopId,
        name: 'Shop A',
        slug: 'shop-a',
        is_active: false,
      });
      prisma.shopAuditLog.create.mockResolvedValue({ id: 'log-1' });

      await service.deactivate(shopId, 'actor-1');
      await service.update(shopId, { is_active: false }, 'actor-1');

      const actions = prisma.shopAuditLog.create.mock.calls
        .map((call) => call[0]?.data?.action)
        .filter(Boolean);
      expect(actions).toContain('deactivate_shop');
      expect(actions.filter((a) => a === 'deactivate_shop')).toHaveLength(2);
    });

    it('should not log update_shop when neither name nor is_active changed', async () => {
      prisma.shop.findUnique.mockResolvedValue({
        id: shopId,
        name: 'Shop A',
        slug: 'shop-a',
        is_active: true,
        _count: { items: 0, user_roles: 1 },
      });
      prisma.shop.update.mockResolvedValue({
        id: shopId,
        name: 'Shop A',
        slug: 'shop-a',
        is_active: true,
      });

      await service.update(shopId, {}, 'actor-1');

      expect(prisma.shopAuditLog.create).not.toHaveBeenCalled();
    });
  });
});

