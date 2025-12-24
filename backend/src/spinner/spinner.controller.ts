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
import { FileInterceptor } from '@nestjs/platform-express';
import { SpinnerService } from './spinner.service';
import { CreateSpinSetDto } from './dto/create-spin-set.dto';
import { UpdateSpinSetDto } from './dto/update-spin-set.dto';
import { UploadFrameDto } from './dto/upload-frame.dto';
import { ReorderFramesDto } from './dto/reorder-frames.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('items/:itemId/spin-sets')
@UseGuards(JwtAuthGuard)
export class SpinSetsController {
  constructor(private readonly spinnerService: SpinnerService) {}

  @Get()
  async getSpinSets(@Param('itemId') itemId: string) {
    return this.spinnerService.getSpinSets(itemId);
  }

  @Post()
  async createSpinSet(
    @Param('itemId') itemId: string,
    @Body() createDto: CreateSpinSetDto,
  ) {
    return this.spinnerService.createSpinSet(itemId, createDto);
  }
}

@Controller('spin-sets/:spinSetId')
@UseGuards(JwtAuthGuard)
export class SpinSetController {
  constructor(private readonly spinnerService: SpinnerService) {}

  @Patch()
  async updateSpinSet(
    @Param('spinSetId') spinSetId: string,
    @Body() updateDto: UpdateSpinSetDto,
  ) {
    return this.spinnerService.updateSpinSet(spinSetId, updateDto);
  }

  @Post('frames')
  @UseInterceptors(FileInterceptor('frame'))
  async uploadFrame(
    @Param('spinSetId') spinSetId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { frame_index?: string },
  ) {
    if (!file) {
      throw new Error('Frame file is required');
    }
    const uploadDto: UploadFrameDto = {};
    if (body.frame_index !== undefined) {
      uploadDto.frame_index = parseInt(body.frame_index, 10);
    }
    return this.spinnerService.uploadFrame(spinSetId, file, uploadDto);
  }

  @Patch('frames/order')
  async reorderFrames(
    @Param('spinSetId') spinSetId: string,
    @Body() reorderDto: ReorderFramesDto,
  ) {
    return this.spinnerService.reorderFrames(spinSetId, reorderDto);
  }

  @Delete('frames/:frameId')
  @HttpCode(HttpStatus.OK)
  async deleteFrame(
    @Param('spinSetId') spinSetId: string,
    @Param('frameId') frameId: string,
  ) {
    return this.spinnerService.deleteFrame(spinSetId, frameId);
  }
}

