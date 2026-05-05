import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';
import { CurrentUserId } from '../common/decorators/current-user-id.decorator';
import { ShopRole } from '../generated/prisma/client';
import { ShopsService } from './shops.service';
import { UpdateShopSettingsDto } from './dto/update-shop-appearance.dto';
import { ShopBrandingUploadDto } from './dto/shop-branding-upload.dto';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';

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

  /** Multipart: field `file` + body `kind` = logo | favicon */
  @Post('branding-upload')
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Roles(ShopRole.shop_admin)
  @UseInterceptors(FileInterceptor('file'))
  uploadBranding(
    @CurrentTenantId() tenantId: string,
    @Body() body: ShopBrandingUploadDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUserId() actorUserId: string | null,
  ) {
    if (!file) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'File is required');
    }
    return this.shopsService.uploadAppearanceAsset(tenantId, body.kind, file, actorUserId);
  }
}
