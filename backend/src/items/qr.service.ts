import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';

@Injectable()
export class QrService {
  constructor(private prisma: PrismaService) {}

  private generateToken(): string {
    return crypto.randomBytes(8).toString('hex');
  }

  private async getOrCreateToken(itemId: string, tenantId: string): Promise<string> {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, shop_id: tenantId, deleted_at: null },
      select: { id: true, qr_token: true },
    });
    if (!item) throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
    if (item.qr_token) return item.qr_token;

    for (let attempt = 0; attempt < 3; attempt++) {
      const token = this.generateToken();
      try {
        await this.prisma.item.update({
          where: { id: itemId },
          data: { qr_token: token },
        });
        return token;
      } catch (err) {
        // Only retry on unique constraint violation (Prisma P2002); surface all other errors immediately.
        const isUniqueViolation =
          typeof err === 'object' && err !== null && (err as Record<string, unknown>)['code'] === 'P2002';
        if (!isUniqueViolation || attempt === 2) {
          throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, 'Failed to generate QR token');
        }
      }
    }
    throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, 'Failed to generate QR token');
  }

  async getQrCode(itemId: string, tenantId: string, gatewayBaseUrl: string) {
    const token = await this.getOrCreateToken(itemId, tenantId);
    // URL embedded in QR points to the public resolve endpoint.
    const resolveUrl = `${gatewayBaseUrl}/api/v1/public/qr/${token}`;
    const imageDataUrl = await QRCode.toDataURL(resolveUrl, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'M',
    });
    return { token, resolve_url: resolveUrl, image_data_url: imageDataUrl };
  }

  async resolveToken(token: string, frontendBaseUrl: string): Promise<{ redirect_url: string }> {
    const item = await this.prisma.item.findFirst({
      where: { qr_token: token, deleted_at: null, is_public: true },
      select: { id: true, shop_id: true },
    });
    if (!item) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Mã QR không hợp lệ hoặc sản phẩm không còn hiển thị công khai');
    }

    const shop = await this.prisma.shop.findFirst({
      where: { id: item.shop_id ?? undefined, is_active: true },
      select: { id: true },
    });
    if (!shop) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Shop không còn hoạt động');
    }

    const redirectUrl = `${frontendBaseUrl}/items/${item.id}?shop_id=${shop.id}&source=qr&action=view`;
    return { redirect_url: redirectUrl };
  }
}
