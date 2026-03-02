import {
  Injectable,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { ImageProcessorService, WatermarkProcessingError } from '../image-processor/image-processor.service';
import { IStorageService } from '../storage/storage.interface';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { UpdateImageDto } from './dto/update-image.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';

@Injectable()
export class ImagesService {
  constructor(
    private prisma: PrismaService,
    private imageProcessor: ImageProcessorService,
    @Inject('IStorageService') private storage: IStorageService,
  ) {}

  async uploadImage(itemId: string, file: Express.Multer.File, isCover?: boolean) {
    // Validate item exists
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, deleted_at: null },
    });

    if (!item) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
    }

    // Validate file
    this.validateFile(file);

    // Process image and generate thumbnail
    let processedImage: Buffer;
    try {
      processedImage = await this.imageProcessor.processImage(file.buffer, {
        watermark: true,
      });
    } catch (error) {
      if (error instanceof WatermarkProcessingError) {
        throw new AppException(
          ErrorCode.IMAGE_WATERMARK_FAILED,
          'Không thể đóng watermark cho ảnh. Vui lòng chọn ảnh khác hoặc giảm kích thước.',
        );
      }
      throw error;
    }
    const thumbnail = await this.imageProcessor.generateThumbnail(file.buffer);

    // Generate filenames
    const imageFilename = this.imageProcessor.generateFilename(file.originalname);
    const thumbnailFilename = this.imageProcessor.generateFilename(file.originalname);

    // Save files
    const imagePath = await this.storage.saveFile(
      processedImage,
      imageFilename,
      'images',
    );
    const thumbnailPath = await this.storage.saveFile(
      thumbnail,
      `thumb_${thumbnailFilename}`,
      'thumbnails',
    );

    // Get current max display_order
    const maxOrder = await this.prisma.itemImage.findFirst({
      where: { item_id: itemId },
      orderBy: { display_order: 'desc' },
      select: { display_order: true },
    });

    const displayOrder = maxOrder ? maxOrder.display_order + 1 : 0;

    // If this is cover or first image, set as cover and unset others
    const shouldSetCover = isCover || displayOrder === 0;
    if (shouldSetCover) {
      await this.prisma.itemImage.updateMany({
        where: { item_id: itemId, is_cover: true },
        data: { is_cover: false },
      });
    }

    // Create image record
    const image = await this.prisma.itemImage.create({
      data: {
        item_id: itemId,
        file_path: imagePath,
        thumbnail_path: thumbnailPath,
        is_cover: shouldSetCover,
        display_order: displayOrder,
      },
    });

    return {
      image: {
        id: image.id,
        item_id: image.item_id,
        url: this.storage.getFileUrl(image.file_path),
        thumbnail_url: image.thumbnail_path
          ? this.storage.getFileUrl(image.thumbnail_path)
          : null,
        is_cover: image.is_cover,
        display_order: image.display_order,
        created_at: image.created_at,
      },
    };
  }

  async updateImage(itemId: string, imageId: string, updateDto: UpdateImageDto) {
    const image = await this.prisma.itemImage.findFirst({
      where: {
        id: imageId,
        item_id: itemId,
      },
    });

    if (!image) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Image not found');
    }

    const updateData: Prisma.ItemImageUpdateInput = {};

    if (updateDto.is_cover !== undefined) {
      if (updateDto.is_cover) {
        // Unset other covers
        await this.prisma.itemImage.updateMany({
          where: { item_id: itemId, is_cover: true },
          data: { is_cover: false },
        });
      }
      updateData.is_cover = updateDto.is_cover;
    }

    if (updateDto.display_order !== undefined) {
      updateData.display_order = updateDto.display_order;
    }

    const updated = await this.prisma.itemImage.update({
      where: { id: imageId },
      data: updateData,
    });

    return {
      image: {
        id: updated.id,
        item_id: updated.item_id,
        url: this.storage.getFileUrl(updated.file_path),
        thumbnail_url: updated.thumbnail_path
          ? this.storage.getFileUrl(updated.thumbnail_path)
          : null,
        is_cover: updated.is_cover,
        display_order: updated.display_order,
        created_at: updated.created_at,
      },
    };
  }

  async reorderImages(itemId: string, reorderDto: ReorderImagesDto) {
    // Validate all images belong to this item
    const images = await this.prisma.itemImage.findMany({
      where: {
        item_id: itemId,
        id: { in: reorderDto.image_ids },
      },
    });

    if (images.length !== reorderDto.image_ids.length) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'Some image IDs do not belong to this item',
      );
    }

    // Update display_order
    const updates = reorderDto.image_ids.map((id, index) =>
      this.prisma.itemImage.update({
        where: { id },
        data: { display_order: index },
      }),
    );

    await Promise.all(updates);

    const updatedImages = await this.prisma.itemImage.findMany({
      where: { item_id: itemId },
      orderBy: { display_order: 'asc' },
    });

    return {
      images: updatedImages.map((img) => ({
        id: img.id,
        item_id: img.item_id,
        url: this.storage.getFileUrl(img.file_path),
        thumbnail_url: img.thumbnail_path
          ? this.storage.getFileUrl(img.thumbnail_path)
          : null,
        is_cover: img.is_cover,
        display_order: img.display_order,
        created_at: img.created_at,
      })),
    };
  }

  async deleteImage(itemId: string, imageId: string) {
    const image = await this.prisma.itemImage.findFirst({
      where: {
        id: imageId,
        item_id: itemId,
      },
    });

    if (!image) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Image not found');
    }

    const wasCover = image.is_cover;

    // Delete file and thumbnail
    await this.storage.deleteFile(image.file_path);
    if (image.thumbnail_path) {
      await this.storage.deleteFile(image.thumbnail_path);
    }

    // Delete record
    await this.prisma.itemImage.delete({
      where: { id: imageId },
    });

    // If cover was deleted, set first remaining image as cover
    if (wasCover) {
      const firstRemaining = await this.prisma.itemImage.findFirst({
        where: { item_id: itemId },
        orderBy: { display_order: 'asc' },
      });

      if (firstRemaining) {
        await this.prisma.itemImage.update({
          where: { id: firstRemaining.id },
          data: { is_cover: true },
        });
      }
    }

    // Reorder remaining images
    const remainingImages = await this.prisma.itemImage.findMany({
      where: { item_id: itemId },
      orderBy: { display_order: 'asc' },
    });

    await Promise.all(
      remainingImages.map((img, index) =>
        this.prisma.itemImage.update({
          where: { id: img.id },
          data: { display_order: index },
        }),
      ),
    );

    return {};
  }

  private validateFile(file: Express.Multer.File) {
    const allowedMime = (process.env.ALLOWED_MIME || 'image/jpeg,image/png')
      .split(',')
      .map((m) => m.trim());

    if (!allowedMime.includes(file.mimetype)) {
      throw new AppException(
        ErrorCode.UPLOAD_INVALID_TYPE,
        `Invalid file type. Allowed types: ${allowedMime.join(', ')}`,
      );
    }

    const maxSizeMB = parseInt(process.env.MAX_UPLOAD_MB || '10');
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      throw new AppException(
        ErrorCode.UPLOAD_TOO_LARGE,
        `File size exceeds maximum of ${maxSizeMB}MB`,
      );
    }
  }
}

