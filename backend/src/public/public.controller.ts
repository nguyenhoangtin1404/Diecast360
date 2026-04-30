import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PublicService } from './public.service';
import { PublicShopResolverService } from './public-shop-resolver.service';
import { QueryPublicItemsDto } from './dto/query-public-items.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('public')
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly publicShopResolver: PublicShopResolverService,
  ) {}

  @Get('items')
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(@Query() queryDto: QueryPublicItemsDto, @Req() req: Request) {
    const user = req.user as { active_shop_id?: string | null } | undefined;
    const explicitShopId = await this.publicShopResolver.resolveCanonicalShopId(queryDto.shop_id);
    const tenantId = explicitShopId ?? user?.active_shop_id ?? null;
    return this.publicService.findAll(queryDto, tenantId);
  }

  @Get('items/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @Query('shop_id') shopId: string | undefined,
    @Req() req: Request,
  ) {
    const user = req.user as { active_shop_id?: string | null } | undefined;
    const explicitShopId = await this.publicShopResolver.resolveCanonicalShopId(shopId);
    const tenantId = explicitShopId ?? user?.active_shop_id ?? null;
    return this.publicService.findOne(id, tenantId);
  }
}

