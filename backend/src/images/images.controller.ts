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
import { FileInterceptor } from '@nestjs/platform-express';
import { ImagesService } from './images.service';
import { UpdateImageDto } from './dto/update-image.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('items/:itemId/images')
@UseGuards(JwtAuthGuard)
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Param('itemId') itemId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { is_cover?: string | boolean },
  ) {
    if (!file) {
      throw new Error('File is required');
    }
    const isCover = body.is_cover === 'true' || body.is_cover === true;
    return this.imagesService.uploadImage(itemId, file, isCover);
  }

  @Patch(':imageId')
  async updateImage(
    @Param('itemId') itemId: string,
    @Param('imageId') imageId: string,
    @Body() updateDto: UpdateImageDto,
  ) {
    return this.imagesService.updateImage(itemId, imageId, updateDto);
  }

  @Patch('order')
  async reorderImages(
    @Param('itemId') itemId: string,
    @Body() reorderDto: ReorderImagesDto,
  ) {
    return this.imagesService.reorderImages(itemId, reorderDto);
  }

  @Delete(':imageId')
  @HttpCode(HttpStatus.OK)
  async deleteImage(
    @Param('itemId') itemId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.imagesService.deleteImage(itemId, imageId);
  }
}

