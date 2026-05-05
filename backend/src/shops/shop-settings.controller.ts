import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { ShopRole } from '../generated/prisma/client';
import { ShopsService } from './shops.service';
import { UpdateShopSettingsDto } from './dto/update-shop-appearance.dto';

/**
 * Tenant-scoped shop branding + public contact copy.
 * Routes: /shop-settings (active shop from JWT / TenantGuard).
 *
 * GET: shop_admin or shop_staff (read-only for staff via RolesGuard).
 * PATCH: shop_admin only — staff cannot change public contact / branding.
 */
@Controller('shop-settings')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ShopSettingsController {
  constructor(private readonly shopsService: ShopsService) {}

  @Get()
  @Roles(ShopRole.shop_admin, ShopRole.shop_staff)
  getSettings(@CurrentTenantId() tenantId: string) {
    return this.shopsService.getTenantShopSettings(tenantId);
  }

  @Patch()
  @Roles(ShopRole.shop_admin)
  updateSettings(
    @CurrentTenantId() tenantId: string,
    @Body() dto: UpdateShopSettingsDto,
    @CurrentUserId() actorUserId: string | null,
  ) {
    return this.shopsService.updateContactAndAppearanceForTenant(
      tenantId,
      dto.contact,
      dto.appearance,
      actorUserId,
    );
  }
}
