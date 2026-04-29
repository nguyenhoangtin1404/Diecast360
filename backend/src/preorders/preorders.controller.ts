import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { PreordersService } from './preorders.service';
import { CreatePreorderDto } from './dto/create-preorder.dto';
import { UpdatePreorderDto } from './dto/update-preorder.dto';
import { TransitionPreorderStatusDto } from './dto/transition-preorder-status.dto';
import { QueryPreordersDto } from './dto/query-preorders.dto';
import { QueryPublicPreordersDto } from './dto/query-public-preorders.dto';
import { ShopRole } from '../generated/prisma/client';

@Controller('preorders')
export class PreordersController {
  constructor(private readonly preordersService: PreordersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(ShopRole.shop_admin, ShopRole.shop_staff)
  create(
    @Body() dto: CreatePreorderDto,
    @CurrentTenantId() tenantId: string,
    @CurrentUserId() userId: string | null,
    @Req() req: Request,
  ) {
    const role = (req.user as { role?: string } | undefined)?.role ?? null;
    return this.preordersService.create(dto, tenantId, { userId, role });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(ShopRole.shop_admin, ShopRole.shop_staff)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePreorderDto,
    @CurrentTenantId() tenantId: string,
    @CurrentUserId() userId: string | null,
    @Req() req: Request,
  ) {
    const role = (req.user as { role?: string } | undefined)?.role ?? null;
    return this.preordersService.update(id, dto, tenantId, { userId, role });
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(ShopRole.shop_admin, ShopRole.shop_staff)
  transitionStatus(
    @Param('id') id: string,
    @Body() dto: TransitionPreorderStatusDto,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.preordersService.transitionStatus(id, dto.status, tenantId);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(ShopRole.shop_admin, ShopRole.shop_staff)
  findAdminList(@Query() query: QueryPreordersDto, @CurrentTenantId() tenantId: string) {
    return this.preordersService.findAdminList(query, tenantId);
  }

  @Get('admin/summary')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(ShopRole.shop_admin, ShopRole.shop_staff)
  getAdminSummary(@CurrentTenantId() tenantId: string) {
    return this.preordersService.getAdminSummary(tenantId);
  }

  @Get('admin/campaigns/:itemId/participants')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(ShopRole.shop_admin, ShopRole.shop_staff)
  getParticipants(
    @Param('itemId') itemId: string,
    @CurrentTenantId() tenantId: string,
    @Query() query: QueryPreordersDto,
  ) {
    return this.preordersService.getCampaignParticipants(itemId, tenantId, query);
  }

  @Get('public')
  findPublicCards(@Query() query: QueryPublicPreordersDto) {
    return this.preordersService.findPublicCards(query.shop_id, query);
  }

  @Get('my-orders')
  @UseGuards(JwtAuthGuard, TenantGuard)
  findMyOrders(
    @CurrentUserId() userId: string | null,
    @CurrentTenantId() tenantId: string,
    @Query() query: QueryPreordersDto,
  ) {
    if (!userId) {
      throw new AppException(ErrorCode.AUTH_FORBIDDEN, 'Authenticated user id is required');
    }
    return this.preordersService.findMyOrders(userId, tenantId, query);
  }
}
