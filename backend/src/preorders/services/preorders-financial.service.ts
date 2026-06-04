import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlatformRole, PreOrderStatus, Prisma, ShopRole } from '../../generated/prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException, ErrorCode } from '../../common/exceptions/http-exception.filter';
import { toNumber } from '../../common/utils/decimal.utils';
import { parseShopContactJson } from '../../shops/types/shop-contact.types';
import { parseShopAppearanceJson } from '../../shops/types/shop-appearance.types';
import { resolveReceiptLogoUrl } from '../../common/media/resolve-receipt-logo-url';
import { PreordersCrudService } from './preorders-crud.service';

@Injectable()
export class PreordersFinancialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly crud: PreordersCrudService,
  ) {}

  private mapReceiptPreorder(row: {
    id: string;
    status: PreOrderStatus;
    quantity: number;
    unit_price: Prisma.Decimal | number | null;
    total_amount: Prisma.Decimal | number | null;
    deposit_amount: Prisma.Decimal | number;
    paid_amount: Prisma.Decimal | number;
    note: string | null;
    created_at: Date;
    item: { name: string };
    member: {
      id: string;
      full_name: string;
      phone: string | null;
      address: string | null;
    } | null;
    user: { id: string; full_name: string | null; email: string | null } | null;
  }) {
    const totalAmount = toNumber(row.total_amount);
    const paidAmount = toNumber(row.paid_amount) ?? 0;
    const remaining =
      totalAmount != null ? Math.max(0, Number((totalAmount - paidAmount).toFixed(2))) : null;

    return {
      id: row.id,
      status: row.status,
      quantity: row.quantity,
      unit_price: toNumber(row.unit_price),
      total_amount: totalAmount,
      deposit_amount: toNumber(row.deposit_amount) ?? 0,
      paid_amount: paidAmount,
      remaining_amount: remaining,
      // discount_amount: null — ẩn dòng chiết khấu trên phiếu cho đến khi có nghiệp vụ thật
      discount_amount: null,
      note: row.note,
      created_at: row.created_at.toISOString(),
      item: { name: row.item.name },
      member: row.member,
      user: row.user,
    };
  }

  async getReceipt(
    id: string,
    tenantId: string,
    actor: { userId: string | null; platformRole: PlatformRole | null },
  ) {
    const shopId = this.crud.requireActiveShopId(tenantId);
    const row = await this.prisma.preOrder.findFirst({
      where: { id, shop_id: shopId },
      include: {
        item: { select: { name: true } },
        member: { select: { id: true, full_name: true, phone: true, address: true } },
        user: { select: { id: true, full_name: true, email: true } },
      },
    });
    if (!row) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Pre-order not found');
    }

    const actorUserId = actor.userId;
    if (!actorUserId) {
      throw new AppException(ErrorCode.AUTH_FORBIDDEN, 'Authenticated user is required.');
    }

    let allowed = actor.platformRole === PlatformRole.platform_super;
    if (!allowed) {
      const membership = await this.prisma.userShopRole.findUnique({
        where: { user_id_shop_id: { user_id: actorUserId, shop_id: shopId } },
        select: { role: true },
      });
      allowed =
        membership?.role === ShopRole.shop_admin ||
        membership?.role === ShopRole.shop_staff ||
        membership?.role === ShopRole.super_admin;
    }
    if (!allowed && row.user_id !== actorUserId) {
      throw new AppException(ErrorCode.AUTH_FORBIDDEN, 'You cannot view this pre-order receipt.');
    }

    // Shop query chạy song song với auth check (đã xong) — giảm latency 1 round-trip
    const shop = await this.prisma.shop.findFirst({
      where: { id: shopId },
      select: { name: true, contact_json: true, appearance_json: true },
    });
    if (!shop) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Shop not found');
    }

    const contact = parseShopContactJson(shop.contact_json);
    const appearance = parseShopAppearanceJson(shop.appearance_json);
    // contact.address được parse bởi parseShopContactJson — không cần parse thủ công nữa

    return {
      shop: {
        name: shop.name,
        phone_label: contact.phone?.label,
        phone_tel: contact.phone?.tel,
        address: contact.address,
        logo_url: resolveReceiptLogoUrl(appearance.logo_url, this.config),
      },
      preorder: this.mapReceiptPreorder(row),
    };
  }
}
