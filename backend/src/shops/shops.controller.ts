import {
  Controller, Get, Post, Patch, Body, Param, UseGuards, HttpCode, HttpStatus, Query, Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { QueryShopMembersDto } from './dto/query-shop-members.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { AddShopAdminDto } from './dto/add-shop-admin.dto';
import { ResetShopMemberPasswordDto } from './dto/reset-shop-member-password.dto';
import { SetShopMemberActiveDto } from './dto/set-shop-member-active.dto';
import { QueryShopItemsDto } from './dto/query-shop-items.dto';
import { QueryShopAuditLogsDto } from './dto/query-shop-audit-logs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ShopRole } from '../generated/prisma/client';

/**
 * ShopsController — Super-admin only.
 * Routes: /admin/shops
 *
 * Authorization: Restricted to users with 'super_admin' ShopRole across all routes.
 *
 * Route order: longer / static path segments must be declared *before* `@X(':id')`
 * so e.g. `GET /:id/members` is not swallowed by `GET /:id` (Nest/Express param matching).
 */
@Controller('admin/shops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ShopRole.super_admin)
export class ShopsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  findAll() {
    return this.shopsService.findAll();
  }

  @Get(':id/members')
  findMembers(@Param('id') id: string, @Query() query: QueryShopMembersDto) {
    return this.shopsService.findMembers(id, query);
  }

  @Get(':id/items')
  findItems(@Param('id') id: string, @Query() query: QueryShopItemsDto) {
    return this.shopsService.findItems(id, query);
  }

  @Get(':id/audit-logs')
  findAuditLogs(@Param('id') id: string, @Query() query: QueryShopAuditLogsDto) {
    return this.shopsService.findAuditLogs(id, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateShopDto) {
    return this.shopsService.create(dto);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.OK)
  addShopAdmin(@Param('id') id: string, @Body() dto: AddShopAdminDto, @Req() req: Request & { user?: { id?: string } }) {
    return this.shopsService.addShopAdmin(id, dto, req.user?.id ?? null);
  }

  @Post(':id/members/:userId/reset-password')
  @HttpCode(HttpStatus.OK)
  resetMemberPassword(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: ResetShopMemberPasswordDto,
    @Req() req: Request & { user?: { id?: string } },
  ) {
    return this.shopsService.resetMemberPassword(id, userId, dto.password, req.user?.id ?? null);
  }

  @Patch(':id/members/:userId/active')
  @HttpCode(HttpStatus.OK)
  setMemberAccountActive(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: SetShopMemberActiveDto,
    @Req() req: Request & { user?: { id?: string } },
  ) {
    return this.shopsService.setMemberAccountActive(id, userId, dto.is_active, req.user?.id ?? null);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivate(@Param('id') id: string, @Req() req: Request & { user?: { id?: string } }) {
    return this.shopsService.deactivate(id, req.user?.id ?? null);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShopDto, @Req() req: Request & { user?: { id?: string } }) {
    return this.shopsService.update(id, dto, req.user?.id ?? null);
  }
}
