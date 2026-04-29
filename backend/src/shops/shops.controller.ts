import {
  Controller, Get, Post, Patch, Body, Param, UseGuards, HttpCode, HttpStatus, Query,
} from '@nestjs/common';
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
import { PlatformRoles } from '../common/decorators/platform-roles.decorator';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { PlatformRole } from '../generated/prisma/client';

/**
 * ShopsController — Platform operator only.
 * Routes: /admin/shops
 *
 * Authorization: Restricted to users with platform_role = platform_super.
 * Uses @PlatformRoles (not @Roles) because shop management is a platform-level
 * capability that does not require an active tenant context.
 *
 * Route order: longer / static path segments must be declared *before* `@X(':id')`
 * so e.g. `GET /:id/members` is not swallowed by `GET /:id` (Nest/Express param matching).
 */
@Controller('admin/shops')
@UseGuards(JwtAuthGuard, RolesGuard)
@PlatformRoles(PlatformRole.platform_super)
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
  addShopAdmin(@Param('id') id: string, @Body() dto: AddShopAdminDto, @CurrentUserId() actorUserId: string | null) {
    return this.shopsService.addShopAdmin(id, dto, actorUserId);
  }

  @Post(':id/members/:userId/reset-password')
  @HttpCode(HttpStatus.OK)
  resetMemberPassword(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: ResetShopMemberPasswordDto,
    @CurrentUserId() actorUserId: string | null,
  ) {
    return this.shopsService.resetMemberPassword(id, userId, dto.password, actorUserId);
  }

  @Patch(':id/members/:userId/active')
  @HttpCode(HttpStatus.OK)
  setMemberAccountActive(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: SetShopMemberActiveDto,
    @CurrentUserId() actorUserId: string | null,
  ) {
    return this.shopsService.setMemberAccountActive(id, userId, dto.is_active, actorUserId);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivate(@Param('id') id: string, @CurrentUserId() actorUserId: string | null) {
    return this.shopsService.deactivate(id, actorUserId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShopDto, @CurrentUserId() actorUserId: string | null) {
    return this.shopsService.update(id, dto, actorUserId);
  }
}
