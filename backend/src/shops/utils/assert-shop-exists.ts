import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException, ErrorCode } from '../../common/exceptions/http-exception.filter';

export async function assertShopExists(prisma: PrismaService, shopId: string): Promise<void> {
  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { id: true } });
  if (!shop) {
    throw new AppException(ErrorCode.NOT_FOUND, `Shop ${shopId} not found`);
  }
}
