import {
  Controller,
  Get,
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
import { SpinnerService } from './spinner.service';
import { CreateSpinSetDto } from './dto/create-spin-set.dto';
import { UpdateSpinSetDto } from './dto/update-spin-set.dto';
import { UploadFrameDto } from './dto/upload-frame.dto';
import { ReorderFramesDto } from './dto/reorder-frames.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ShopRole } from '../generated/prisma/client';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';

@Controller('items/:itemId/spin-sets')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(ShopRole.shop_admin, ShopRole.shop_staff)
export class SpinSetsController {
  constructor(private readonly spinnerService: SpinnerService) {}

  @Get()
  async getSpinSets(
    @Param('itemId') itemId: string,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.spinnerService.getSpinSets(itemId, tenantId);
  }

  @Post()
  async createSpinSet(
    @Param('itemId') itemId: string,
    @Body() createDto: CreateSpinSetDto,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.spinnerService.createSpinSet(itemId, createDto, tenantId);
  }
}

@Controller('spin-sets/:spinSetId')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(ShopRole.shop_admin, ShopRole.shop_staff)
export class SpinSetController {
  constructor(private readonly spinnerService: SpinnerService) {}

  @Patch()
  async updateSpinSet(
    @Param('spinSetId') spinSetId: string,
    @Body() updateDto: UpdateSpinSetDto,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.spinnerService.updateSpinSet(spinSetId, updateDto, tenantId);
  }

  @Post('frames')
  @Throttle({ default: { ttl: 60000, limit: 35 } })
  @UseInterceptors(FileInterceptor('frame'))
  async uploadFrame(
    @Param('spinSetId') spinSetId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { frame_index?: string },
    @CurrentTenantId() tenantId: string,
  ) {
    if (!file) {
      throw new Error('Frame file is required');
    }
    const uploadDto: UploadFrameDto = {};
    if (body.frame_index !== undefined) {
      uploadDto.frame_index = parseInt(body.frame_index, 10);
    }
    return this.spinnerService.uploadFrame(spinSetId, file, uploadDto, tenantId);
  }

  @Patch('frames/order')
  async reorderFrames(
    @Param('spinSetId') spinSetId: string,
    @Body() reorderDto: ReorderFramesDto,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.spinnerService.reorderFrames(spinSetId, reorderDto, tenantId);
  }

  @Delete('frames/:frameId')
  @HttpCode(HttpStatus.OK)
  async deleteFrame(
    @Param('spinSetId') spinSetId: string,
    @Param('frameId') frameId: string,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.spinnerService.deleteFrame(spinSetId, frameId, tenantId);
  }
}

