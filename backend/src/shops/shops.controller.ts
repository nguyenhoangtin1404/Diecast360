import {
  Controller, Get, Post, Patch, Body, Param, Delete, UseGuards, HttpCode, HttpStatus, Query,
} from '@nestjs/common';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { QueryShopMembersDto } from './dto/query-shop-members.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ShopRole } from '../generated/prisma/client';

/**
 * ShopsController — Super-admin only.
 * Routes: /admin/shops
 *
 * Authorization: Restricted to users with 'super_admin' ShopRole across all routes.
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateShopDto) {
    return this.shopsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateShopDto) {
    return this.shopsService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivate(@Param('id') id: string) {
    return this.shopsService.deactivate(id);
  }

  @Get(':id/members')
  findMembers(@Param('id') id: string, @Query() query: QueryShopMembersDto) {
    return this.shopsService.findMembers(id, query);
  }
}
