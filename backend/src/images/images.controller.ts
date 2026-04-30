import {
  Controller,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImagesService } from './images.service';
import { UpdateImageDto } from './dto/update-image.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ShopRole } from '../generated/prisma/client';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';

@Controller('items/:itemId/images')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(ShopRole.shop_admin, ShopRole.shop_staff)
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 40 } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('itemId') itemId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { is_cover?: string | boolean },
    @CurrentTenantId() tenantId: string,
  ) {
    if (!file) {
      throw new Error('File is required');
    }
    const isCover = body.is_cover === 'true' || body.is_cover === true;
    return this.imagesService.uploadImage(itemId, file, isCover, tenantId);
  }

  @Patch(':imageId')
  async updateImage(
    @Param('itemId') itemId: string,
    @Param('imageId') imageId: string,
    @Body() updateDto: UpdateImageDto,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.imagesService.updateImage(itemId, imageId, updateDto, tenantId);
  }

  @Patch('order')
  async reorderImages(
    @Param('itemId') itemId: string,
    @Body() reorderDto: ReorderImagesDto,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.imagesService.reorderImages(itemId, reorderDto, tenantId);
  }

  @Delete(':imageId')
  @HttpCode(HttpStatus.OK)
  async deleteImage(
    @Param('itemId') itemId: string,
    @Param('imageId') imageId: string,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.imagesService.deleteImage(itemId, imageId, tenantId);
  }
}

