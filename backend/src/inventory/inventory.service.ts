import { Injectable } from '@nestjs/common';
import {
  InventoryTransactionType,
  Prisma,
} from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { QueryInventoryTransactionsDto } from './dto/query-inventory-transactions.dto';
import { totalPagesFromCount } from '../common/utils/pagination.utils';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async createTransaction(
    itemId: string,
    dto: CreateInventoryTransactionDto,
    tenantId: string,
    actorUserId: string | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const item = await this.lockItemForUpdate(tx, itemId, tenantId);

      if (!item) {
        throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
      }

      if (item.status === 'da_ban') {
        throw new AppException(
          ErrorCode.VALIDATION_ERROR,
          'Cannot create inventory transaction for sold item.',
        );
      }

      const delta = this.resolveDelta(dto);
      const nextQuantity = item.quantity + delta;
      if (!dto.allow_negative_stock && nextQuantity < 0) {
        throw new AppException(
          ErrorCode.VALIDATION_ERROR,
          `Inventory transaction would result in negative stock (${nextQuantity}).`,
        );
      }

      await tx.item.update({
        where: { id: item.id },
        data: { quantity: nextQuantity },
      });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          item_id: item.id,
          shop_id: item.shop_id ?? tenantId,
          actor_user_id: actorUserId,
          type: dto.type,
          quantity: this.resolveQuantityForLedger(dto, delta),
          delta,
          resulting_quantity: nextQuantity,
          reason: dto.reason.trim(),
          note: dto.note?.trim() || null,
        },
      });

      return { transaction };
    });
  }

  async reverseTransaction(
    itemId: string,
    transactionId: string,
    tenantId: string,
    actorUserId: string | null,
    reason?: string,
    note?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const item = await this.lockItemForUpdate(tx, itemId, tenantId);
      if (!item) {
        throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
      }

      const original = await tx.inventoryTransaction.findFirst({
        where: {
          id: transactionId,
          item_id: itemId,
          shop_id: tenantId,
        },
      });
      if (!original) {
        throw new AppException(ErrorCode.NOT_FOUND, 'Inventory transaction not found');
      }
      if (original.reversal_of_id) {
        throw new AppException(ErrorCode.VALIDATION_ERROR, 'Cannot reverse a reversal transaction.');
      }

      const existingReversal = await tx.inventoryTransaction.findFirst({
        where: { reversal_of_id: original.id },
        select: { id: true },
      });
      if (existingReversal) {
        throw new AppException(ErrorCode.VALIDATION_ERROR, 'Inventory transaction has already been reversed.');
      }

      const reverseDelta = -original.delta;
      const nextQuantity = item.quantity + reverseDelta;
      if (nextQuantity < 0) {
        throw new AppException(
          ErrorCode.VALIDATION_ERROR,
          `Reverse transaction would result in negative stock (${nextQuantity}).`,
        );
      }

      await tx.item.update({
        where: { id: item.id },
        data: { quantity: nextQuantity },
      });

      const reversed = await tx.inventoryTransaction.create({
        data: {
          item_id: item.id,
          shop_id: item.shop_id ?? tenantId,
          actor_user_id: actorUserId,
          reversal_of_id: original.id,
          type: this.resolveReverseType(original.type),
          quantity: Math.abs(reverseDelta),
          delta: reverseDelta,
          resulting_quantity: nextQuantity,
          reason: reason?.trim() || `Reverse transaction ${original.id}`,
          note: note?.trim() || null,
        },
      });

      return { transaction: reversed };
    });
  }

  async listTransactions(itemId: string, query: QueryInventoryTransactionsDto, tenantId: string) {
    await this.ensureItemExists(itemId, tenantId);

    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const skip = (page - 1) * pageSize;
    const where: Prisma.InventoryTransactionWhereInput = {
      item_id: itemId,
      shop_id: tenantId,
    };
    if (query.type) {
      where.type = query.type;
    }

    const [transactions, total, item] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        skip,
        take: pageSize,
      }),
      this.prisma.inventoryTransaction.count({ where }),
      this.prisma.item.findUnique({
        where: { id: itemId },
        select: { quantity: true },
      }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: totalPagesFromCount(total, pageSize),
      },
      current_quantity: item?.quantity ?? 0,
    };
  }

  async getReconciliation(itemId: string, tenantId: string) {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, shop_id: tenantId, deleted_at: null },
      select: { quantity: true },
    });
    if (!item) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
    }

    const transactions = await this.prisma.inventoryTransaction.findMany({
      where: { item_id: itemId, shop_id: tenantId },
      orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
      select: { delta: true, resulting_quantity: true },
    });

    if (transactions.length === 0) {
      return {
        ok: true,
        ledger_count: 0,
        current_quantity: item.quantity,
        ledger_last_quantity: item.quantity,
      };
    }

    const ledgerLastQuantity = transactions[transactions.length - 1].resulting_quantity;
    return {
      ok: ledgerLastQuantity === item.quantity,
      ledger_count: transactions.length,
      current_quantity: item.quantity,
      ledger_last_quantity: ledgerLastQuantity,
    };
  }

  private resolveDelta(dto: CreateInventoryTransactionDto): number {
    if (dto.type === InventoryTransactionType.stock_in) {
      return dto.quantity;
    }
    if (dto.type === InventoryTransactionType.stock_out) {
      return -dto.quantity;
    }
    if (dto.adjustment_delta == null || !Number.isInteger(dto.adjustment_delta) || dto.adjustment_delta === 0) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'adjustment_delta is required for adjustment transaction and must be a non-zero integer.',
      );
    }
    return dto.adjustment_delta;
  }

  private resolveQuantityForLedger(dto: CreateInventoryTransactionDto, delta: number): number {
    if (dto.type === InventoryTransactionType.adjustment) {
      if (dto.quantity !== Math.abs(delta)) {
        throw new AppException(
          ErrorCode.VALIDATION_ERROR,
          'For adjustment transactions, quantity must equal abs(adjustment_delta).',
        );
      }
      return Math.abs(delta);
    }
    return dto.quantity;
  }

  private resolveReverseType(type: InventoryTransactionType): InventoryTransactionType {
    if (type === InventoryTransactionType.stock_in) return InventoryTransactionType.stock_out;
    if (type === InventoryTransactionType.stock_out) return InventoryTransactionType.stock_in;
    return InventoryTransactionType.adjustment;
  }

  private async lockItemForUpdate(tx: Prisma.TransactionClient, itemId: string, tenantId: string) {
    const rows = await tx.$queryRaw<Array<{ id: string; quantity: number; status: 'con_hang' | 'giu_cho' | 'da_ban'; shop_id: string | null }>>(
      Prisma.sql`
        SELECT id, quantity, status, shop_id
        FROM items
        WHERE id = ${itemId}
          AND shop_id = ${tenantId}
          AND deleted_at IS NULL
        FOR UPDATE
      `,
    );
    return rows[0] ?? null;
  }

  private async ensureItemExists(itemId: string, tenantId: string) {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, shop_id: tenantId, deleted_at: null },
      select: { id: true },
    });
    if (!item) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
    }
  }
}
