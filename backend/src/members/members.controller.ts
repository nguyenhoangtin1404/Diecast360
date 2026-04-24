import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ShopRole } from '../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { MembersService } from './members.service';
import { QueryMembersDto } from './dto/query-members.dto';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { AdjustMemberPointsDto } from './dto/adjust-member-points.dto';
import { CreateMembershipTierDto } from './dto/create-membership-tier.dto';
import { UpdateMembershipTierDto } from './dto/update-membership-tier.dto';

@Controller('members')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(ShopRole.shop_admin, ShopRole.super_admin)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  listMembers(@CurrentTenantId() tenantId: string, @Query() query: QueryMembersDto) {
    return this.membersService.listMembers(tenantId, query);
  }

  @Get('tiers')
  listTiers(@CurrentTenantId() tenantId: string) {
    return this.membersService.listTiers(tenantId);
  }

  @Post('tiers')
  createTier(@CurrentTenantId() tenantId: string, @Body() dto: CreateMembershipTierDto) {
    return this.membersService.createTier(tenantId, dto);
  }

  @Patch('tiers/:tierId')
  updateTier(
    @CurrentTenantId() tenantId: string,
    @Param('tierId') tierId: string,
    @Body() dto: UpdateMembershipTierDto,
  ) {
    return this.membersService.updateTier(tenantId, tierId, dto);
  }

  @Delete('tiers/:tierId')
  deleteTier(@CurrentTenantId() tenantId: string, @Param('tierId') tierId: string) {
    return this.membersService.deleteTier(tenantId, tierId);
  }

  @Get(':id')
  getMember(@Param('id') memberId: string, @CurrentTenantId() tenantId: string) {
    return this.membersService.getMember(memberId, tenantId);
  }

  @Post()
  createMember(@Body() dto: CreateMemberDto, @CurrentTenantId() tenantId: string) {
    return this.membersService.createMember(dto, tenantId);
  }

  @Patch(':id')
  updateMember(
    @Param('id') memberId: string,
    @Body() dto: UpdateMemberDto,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.membersService.updateMember(memberId, dto, tenantId);
  }

  @Delete(':id')
  deleteMember(@Param('id') memberId: string, @CurrentTenantId() tenantId: string) {
    return this.membersService.deleteMember(memberId, tenantId);
  }

  @Get(':id/ledger')
  listLedger(
    @Param('id') memberId: string,
    @CurrentTenantId() tenantId: string,
    @Query() query: QueryMembersDto,
  ) {
    return this.membersService.listLedger(memberId, tenantId, query);
  }

  @Post(':id/points-adjustments')
  adjustPoints(
    @Param('id') memberId: string,
    @Body() dto: AdjustMemberPointsDto,
    @CurrentTenantId() tenantId: string,
    @CurrentUserId() userId: string | null,
  ) {
    return this.membersService.adjustPoints(memberId, dto, tenantId, userId);
  }
}
