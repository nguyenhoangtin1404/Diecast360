import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ShopRole } from '../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { InventoryService } from './inventory.service';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { QueryInventoryTransactionsDto } from './dto/query-inventory-transactions.dto';
import { ReverseInventoryTransactionDto } from './dto/reverse-inventory-transaction.dto';

@Controller('inventory/items/:itemId/transactions')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(ShopRole.shop_admin, ShopRole.super_admin)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  create(
    @Param('itemId') itemId: string,
    @Body() dto: CreateInventoryTransactionDto,
    @CurrentTenantId() tenantId: string,
    @CurrentUserId() userId: string | null,
  ) {
    return this.inventoryService.createTransaction(itemId, dto, tenantId, userId);
  }

  @Get()
  list(
    @Param('itemId') itemId: string,
    @Query() query: QueryInventoryTransactionsDto,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.inventoryService.listTransactions(itemId, query, tenantId);
  }

  @Get('reconciliation')
  reconciliation(
    @Param('itemId') itemId: string,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.inventoryService.getReconciliation(itemId, tenantId);
  }

  @Post(':transactionId/reverse')
  reverse(
    @Param('itemId') itemId: string,
    @Param('transactionId') transactionId: string,
    @Body() dto: ReverseInventoryTransactionDto,
    @CurrentTenantId() tenantId: string,
    @CurrentUserId() userId: string | null,
  ) {
    return this.inventoryService.reverseTransaction(
      itemId,
      transactionId,
      tenantId,
      userId,
      dto.reason,
      dto.note,
    );
  }
}
