import { Injectable } from '@nestjs/common';
import { InventoryTransactionType, PreOrderStatus } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { toNumber } from '../common/utils/decimal.utils';
import { type ReportBucket } from './dto/query-report-trends.dto';
import { type ReportRange } from './dto/query-report-summary.dto';

type RangeBounds = {
  range: ReportRange;
  start: Date;
  end: Date;
};

type TrendPoint = {
  bucket_start: string;
  inventory_movement_units: number;
  preorder_created_count: number;
  preorder_paid_count: number;
  preorder_revenue: number;
  facebook_post_count: number;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(tenantId: string, rangeInput?: ReportRange) {
    const bounds = this.resolveRange(rangeInput);
    const [transactions, preordersCreated, preordersPaid, facebookPosts, stockAggregate, activePreorders] =
      await Promise.all([
        this.prisma.inventoryTransaction.findMany({
          where: {
            shop_id: tenantId,
            created_at: { gte: bounds.start, lt: bounds.end },
          },
          select: { type: true, quantity: true, delta: true },
        }),
        this.prisma.preOrder.findMany({
          where: {
            shop_id: tenantId,
            created_at: { gte: bounds.start, lt: bounds.end },
          },
          select: { total_amount: true },
        }),
        this.prisma.preOrder.findMany({
          where: {
            shop_id: tenantId,
            completed_at: { gte: bounds.start, lt: bounds.end },
            status: PreOrderStatus.PAID,
          },
          select: { total_amount: true },
        }),
        this.prisma.facebookPost.findMany({
          where: {
            posted_at: { gte: bounds.start, lt: bounds.end },
            item: { shop_id: tenantId },
          },
          select: { id: true },
        }),
        this.prisma.item.aggregate({
          where: { shop_id: tenantId, deleted_at: null },
          _sum: { quantity: true },
        }),
        this.prisma.preOrder.count({
          where: {
            shop_id: tenantId,
            status: {
              in: [
                PreOrderStatus.PENDING_CONFIRMATION,
                PreOrderStatus.WAITING_FOR_GOODS,
                PreOrderStatus.ARRIVED,
              ],
            },
          },
        }),
      ]);

    const totals = transactions.reduce(
      (acc, row) => {
        if (row.type === InventoryTransactionType.stock_in) {
          acc.stock_in_units += row.quantity;
        } else if (row.type === InventoryTransactionType.stock_out) {
          acc.stock_out_units += row.quantity;
        } else {
          acc.adjustment_net_units += row.delta;
          acc.adjustment_movement_units += Math.abs(row.delta);
        }
        return acc;
      },
      {
        stock_in_units: 0,
        stock_out_units: 0,
        adjustment_net_units: 0,
        adjustment_movement_units: 0,
      },
    );

    const preorderCreatedRevenue = preordersCreated.reduce(
      (sum, row) => sum + (toNumber(row.total_amount) ?? 0),
      0,
    );
    const preorderPaidRevenue = preordersPaid.reduce(
      (sum, row) => sum + (toNumber(row.total_amount) ?? 0),
      0,
    );

    return {
      range: bounds.range,
      from: bounds.start.toISOString(),
      to: bounds.end.toISOString(),
      summary: {
        ...totals,
        movement_units:
          totals.stock_in_units + totals.stock_out_units + totals.adjustment_movement_units,
        preorder_created_count: preordersCreated.length,
        preorder_paid_count: preordersPaid.length,
        preorder_created_revenue: Number(preorderCreatedRevenue.toFixed(2)),
        preorder_paid_revenue: Number(preorderPaidRevenue.toFixed(2)),
        facebook_post_count: facebookPosts.length,
        current_stock_units: stockAggregate._sum.quantity ?? 0,
        active_preorder_count: activePreorders,
      },
    };
  }

  async getTrends(tenantId: string, rangeInput?: ReportRange, bucketInput?: ReportBucket) {
    const bounds = this.resolveRange(rangeInput);
    const bucket = bucketInput ?? 'day';
    const points = this.buildBuckets(bounds, bucket);
    const map = new Map<string, TrendPoint>();
    for (const point of points) {
      map.set(point.bucket_start, point);
    }

    const [transactions, preordersCreated, preordersPaid, facebookPosts] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where: {
          shop_id: tenantId,
          created_at: { gte: bounds.start, lt: bounds.end },
        },
        select: { type: true, quantity: true, delta: true, created_at: true },
      }),
      this.prisma.preOrder.findMany({
        where: {
          shop_id: tenantId,
          created_at: { gte: bounds.start, lt: bounds.end },
        },
        select: { total_amount: true, created_at: true },
      }),
      this.prisma.preOrder.findMany({
        where: {
          shop_id: tenantId,
          completed_at: { gte: bounds.start, lt: bounds.end },
          status: PreOrderStatus.PAID,
        },
        select: { completed_at: true },
      }),
      this.prisma.facebookPost.findMany({
        where: {
          posted_at: { gte: bounds.start, lt: bounds.end },
          item: { shop_id: tenantId },
        },
        select: { posted_at: true },
      }),
    ]);

    for (const row of transactions) {
      const key = this.bucketKey(row.created_at, bucket);
      const point = map.get(key);
      if (!point) continue;
      if (row.type === InventoryTransactionType.adjustment) {
        point.inventory_movement_units += Math.abs(row.delta);
      } else {
        point.inventory_movement_units += row.quantity;
      }
    }

    for (const row of preordersCreated) {
      const key = this.bucketKey(row.created_at, bucket);
      const point = map.get(key);
      if (!point) continue;
      point.preorder_created_count += 1;
      point.preorder_revenue = Number((point.preorder_revenue + (toNumber(row.total_amount) ?? 0)).toFixed(2));
    }

    for (const row of preordersPaid) {
      if (!row.completed_at) continue;
      const key = this.bucketKey(row.completed_at, bucket);
      const point = map.get(key);
      if (!point) continue;
      point.preorder_paid_count += 1;
    }

    for (const row of facebookPosts) {
      const key = this.bucketKey(row.posted_at, bucket);
      const point = map.get(key);
      if (!point) continue;
      point.facebook_post_count += 1;
    }

    return {
      range: bounds.range,
      bucket,
      from: bounds.start.toISOString(),
      to: bounds.end.toISOString(),
      series: points,
    };
  }

  private resolveRange(range: ReportRange | undefined, now: Date = new Date()): RangeBounds {
    const normalizedRange: ReportRange = range ?? '30d';
    const end = now;
    const start = new Date(end);
    if (normalizedRange === '7d') {
      start.setUTCDate(start.getUTCDate() - 6);
    } else if (normalizedRange === '30d') {
      start.setUTCDate(start.getUTCDate() - 29);
    } else {
      start.setUTCDate(start.getUTCDate() - 89);
    }

    return {
      range: normalizedRange,
      start: this.startOfDayUtc(start),
      end: this.endOfDayUtc(end),
    };
  }

  private buildBuckets(bounds: RangeBounds, bucket: ReportBucket): TrendPoint[] {
    const points: TrendPoint[] = [];
    let cursor =
      bucket === 'week'
        ? this.startOfWeekUtc(bounds.start)
        : new Date(bounds.start);
    while (cursor <= bounds.end) {
      points.push({
        bucket_start: cursor.toISOString(),
        inventory_movement_units: 0,
        preorder_created_count: 0,
        preorder_paid_count: 0,
        preorder_revenue: 0,
        facebook_post_count: 0,
      });
      cursor =
        bucket === 'week'
          ? this.addUtcDays(cursor, 7)
          : this.addUtcDays(cursor, 1);
    }
    return points;
  }

  private bucketKey(input: Date, bucket: ReportBucket): string {
    if (bucket === 'week') {
      const normalized = this.startOfWeekUtc(input);
      return normalized.toISOString();
    }
    return this.startOfDayUtc(input).toISOString();
  }

  private addUtcDays(input: Date, days: number): Date {
    const next = new Date(input);
    next.setUTCDate(next.getUTCDate() + days);
    return this.startOfDayUtc(next);
  }

  private startOfDayUtc(input: Date): Date {
    return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate(), 0, 0, 0, 0));
  }

  private endOfDayUtc(input: Date): Date {
    return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate(), 23, 59, 59, 999));
  }

  private startOfWeekUtc(input: Date): Date {
    const day = input.getUTCDay();
    const distanceToMonday = (day + 6) % 7;
    const monday = new Date(input);
    monday.setUTCDate(monday.getUTCDate() - distanceToMonday);
    return this.startOfDayUtc(monday);
  }
}
