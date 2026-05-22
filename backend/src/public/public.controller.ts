import { Controller, Get, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { PublicService } from './public.service';
import { PublicShopResolverService } from './public-shop-resolver.service';
import { QrService } from '../items/qr.service';
import { QueryPublicItemsDto } from './dto/query-public-items.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';

function isProductionEnv(): boolean {
  return (process.env.NODE_ENV || '').trim().toLowerCase() === 'production';
}

@Controller('public')
export class PublicController {
  constructor(
    private readonly publicService: PublicService,
    private readonly publicShopResolver: PublicShopResolverService,
    private readonly qrService: QrService,
  ) {}

  /**
   * In production, anonymous catalog/detail must not aggregate all public items across shops.
   * Require explicit ?shop_id= (or slug) or a JWT with active_shop_id.
   */
  private assertPublicShopScope(
    tenantId: string | null | undefined,
    user: { active_shop_id?: string | null } | undefined,
  ): void {
    if (!isProductionEnv()) {
      return;
    }
    if (tenantId) {
      return;
    }
    if (user?.active_shop_id) {
      return;
    }
    throw new AppException(
      ErrorCode.PUBLIC_SHOP_REQUIRED,
      'Public catalog requires shop_id (UUID or shop slug) or an authenticated session with an active shop.',
    );
  }

  @Get('qr/:token')
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  async resolveQr(
    @Param('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const frontendBaseUrl = process.env.FRONTEND_URL ?? `${req.protocol}://${req.get('host')}`;
    const { redirect_url } = await this.qrService.resolveToken(token, frontendBaseUrl);
    res.redirect(302, redirect_url);
  }

  @Get('shops/:shopId/contact')
  @UseGuards(OptionalJwtAuthGuard)
  async getShopContact(@Param('shopId') shopId: string, @Req() req: Request) {
    const user = req.user as { active_shop_id?: string | null } | undefined;
    const explicitShopId = await this.publicShopResolver.resolveCanonicalShopId(shopId);
    const tenantId = explicitShopId ?? user?.active_shop_id ?? null;
    // Production: same rule as catalog — need ?shop_id / path shop or JWT active shop (422 otherwise).
    this.assertPublicShopScope(tenantId, user);
    // Non-production: assertPublicShopScope is a no-op, but contact is always shop-scoped (no "all shops" view).
    if (!tenantId) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Shop not found');
    }
    return this.publicService.getShopContact(tenantId);
  }

  @Get('items')
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(@Query() queryDto: QueryPublicItemsDto, @Req() req: Request) {
    const user = req.user as { active_shop_id?: string | null } | undefined;
    const explicitShopId = await this.publicShopResolver.resolveCanonicalShopId(queryDto.shop_id);
    const tenantId = explicitShopId ?? user?.active_shop_id ?? null;
    this.assertPublicShopScope(tenantId, user);
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
    this.assertPublicShopScope(tenantId, user);
    return this.publicService.findOne(id, tenantId);
  }
}

