import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoriesDto } from './dto/query-categories.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PlatformRoles } from '../common/decorators/platform-roles.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PlatformRole, ShopRole } from '../generated/prisma/client';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';

type JwtUser = {
  id?: string;
  active_shop_id?: string | null;
  platform_role?: PlatformRole | null;
};

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  private categoriesListContext(req: Request): {
    jwtTenantId?: string | null;
    isPlatformSuper?: boolean;
  } {
    const user = req.user as JwtUser | undefined;
    return {
      jwtTenantId: user?.active_shop_id ?? null,
      isPlatformSuper: user?.platform_role === PlatformRole.platform_super,
    };
  }

  /** Catalog dropdowns: anonymous merges global + optional shop_id query or JWT shop */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Query() queryDto: QueryCategoriesDto, @Req() req: Request) {
    return this.categoriesService.findAll(queryDto, this.categoriesListContext(req));
  }

  /** Shop admin: create category scoped to active shop (before :id routes) */
  @Post('shop')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles(ShopRole.shop_admin)
  createForShop(
    @Body() createDto: CreateCategoryDto,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.categoriesService.createForShop(createDto, tenantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @PlatformRoles(PlatformRole.platform_super)
  createGlobal(@Body() createDto: CreateCategoryDto) {
    return this.categoriesService.createGlobal(createDto);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @PlatformRoles(PlatformRole.platform_super)
  @Roles(ShopRole.shop_admin, ShopRole.shop_staff)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateCategoryDto,
    @Req() req: Request,
  ) {
    const user = req.user as JwtUser | undefined;
    const platformSuper = user?.platform_role === PlatformRole.platform_super;
    if (platformSuper) {
      return this.categoriesService.update(id, updateDto, { isPlatformSuper: true });
    }
    return this.categoriesService.update(id, updateDto, {
      tenantId: user?.active_shop_id ?? null,
      isPlatformSuper: false,
    });
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @PlatformRoles(PlatformRole.platform_super)
  @Roles(ShopRole.shop_admin, ShopRole.shop_staff)
  async toggleActive(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as JwtUser | undefined;
    const platformSuper = user?.platform_role === PlatformRole.platform_super;
    if (platformSuper) {
      return this.categoriesService.toggleActive(id, { isPlatformSuper: true });
    }
    return this.categoriesService.toggleActive(id, {
      tenantId: user?.active_shop_id ?? null,
      isPlatformSuper: false,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @PlatformRoles(PlatformRole.platform_super)
  @Roles(ShopRole.shop_admin, ShopRole.shop_staff)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as JwtUser | undefined;
    const platformSuper = user?.platform_role === PlatformRole.platform_super;
    if (platformSuper) {
      return this.categoriesService.remove(id, { isPlatformSuper: true });
    }
    return this.categoriesService.remove(id, {
      tenantId: user?.active_shop_id ?? null,
      isPlatformSuper: false,
    });
  }
}
