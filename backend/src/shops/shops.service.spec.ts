import { Test, TestingModule } from '@nestjs/testing';
import { ShopsService } from './shops.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/exceptions/http-exception.filter';
import { ShopRole } from '../generated/prisma/client';
import { AddShopAdminDto } from './dto/add-shop-admin.dto';
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
    const userId = 'user-1';

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
  });
});

