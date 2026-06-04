import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QueryShopAuditLogsDto } from '../dto/query-shop-audit-logs.dto';
import { ShopAuditAction } from '../../generated/prisma/client';
import { totalPagesFromCount } from '../../common/utils/pagination.utils';

@Injectable()
export class ShopsAuditService {
  constructor(private prisma: PrismaService) {}

  async createAuditLog(
    shopId: string,
    action: ShopAuditAction,
    actorUserId: string | null,
    targetType: string,
    targetId?: string | null,
    metadata?: Record<string, unknown>,
  ) {
    const safeMetadata = metadata
      ? JSON.stringify(
          metadata,
          (key, value) => {
            const lower = key.toLowerCase();
            if (
              lower.includes('password') ||
              lower.includes('token') ||
              lower.includes('secret')
            ) {
              return '[REDACTED]';
            }
            return value;
          },
        )
      : null;

    await this.prisma.shopAuditLog.create({
      data: {
        shop_id: shopId,
        actor_user_id: actorUserId ?? null,
        action,
        target_type: targetType,
        target_id: targetId ?? null,
        metadata_json: safeMetadata,
      },
    });
  }

  async getAuditLogs(shopId: string, query: QueryShopAuditLogsDto) {
    const page = query.page || 1;
    const pageSize = query.page_size || 20;
    const skip = (page - 1) * pageSize;
    const where = {
      shop_id: shopId,
      ...(query.action ? { action: query.action } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.shopAuditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { created_at: 'desc' },
        include: {
          actor: { select: { id: true, email: true, full_name: true } },
        },
      }),
      this.prisma.shopAuditLog.count({ where }),
    ]);
    return {
      logs: rows.map((r) => ({
        id: r.id,
        action: r.action,
        target_type: r.target_type,
        target_id: r.target_id,
        metadata: r.metadata_json
          ? (() => {
              try {
                return JSON.parse(r.metadata_json);
              } catch {
                return null;
              }
            })()
          : null,
        created_at: r.created_at,
        actor: r.actor,
      })),
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: totalPagesFromCount(total, pageSize),
      },
    };
  }
}
