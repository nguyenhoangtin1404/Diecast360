import {
  Injectable,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma, ItemImage } from '../generated/prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
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
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, deleted_at: null },
    });

    if (!item) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
    }

    this.validateFile(file);

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
    const imageFilename = this.imageProcessor.generateFilename(file.originalname);
    const thumbnailFilename = this.imageProcessor.generateFilename(file.originalname);

    const savedPaths: string[] = [];
    try {
      const imagePath = await this.storage.saveFile(
        processedImage,
        imageFilename,
        'images',
      );
      savedPaths.push(imagePath);

      const thumbnailPath = await this.storage.saveFile(
        thumbnail,
        `thumb_${thumbnailFilename}`,
        'thumbnails',
      );
      savedPaths.push(thumbnailPath);

      const image = await this.insertImageWithOrdering(
        itemId,
        imagePath,
        thumbnailPath,
        Boolean(isCover),
      );

      return { image: this.mapImage(image) };
    } catch (error) {
      await this.cleanupSavedFiles(savedPaths);
      throw error;
    }
  }

  private async insertImageWithOrdering(
    itemId: string,
    imagePath: string,
    thumbnailPath: string,
    isCover: boolean,
  ) {
    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const [imageCount, existingCover] = await Promise.all([
            tx.itemImage.count({ where: { item_id: itemId } }),
            tx.itemImage.findFirst({
              where: { item_id: itemId, is_cover: true },
            }),
          ]);

          const displayOrder = imageCount;
          const shouldSetCover = Boolean(
            isCover || imageCount === 0 || !existingCover,
          );

          if (shouldSetCover) {
            await tx.itemImage.updateMany({
              where: { item_id: itemId, is_cover: true },
              data: { is_cover: false },
            });
          }

          const image = await tx.itemImage.create({
            data: {
              item_id: itemId,
              file_path: imagePath,
              thumbnail_path: thumbnailPath,
              is_cover: shouldSetCover,
              display_order: displayOrder,
            },
          });

          return image;
        });
      } catch (error) {
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          attempt < maxAttempts - 1
        ) {
          continue;
        }
        throw error;
      }
    }

    throw new AppException(
      ErrorCode.VALIDATION_ERROR,
      'Unable to upload image due to concurrency conflict',
    );
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
        await this.prisma.itemImage.updateMany({
          where: { item_id: itemId, is_cover: true },
          data: { is_cover: false },
        });
      } else if (image.is_cover) {
        const replacementCover = await this.prisma.itemImage.findFirst({
          where: {
            item_id: itemId,
            id: { not: imageId },
          },
          orderBy: { display_order: 'asc' },
        });

        if (!replacementCover) {
          throw new AppException(
            ErrorCode.VALIDATION_ERROR,
            'Item must always have one cover image',
          );
        }

        await this.prisma.itemImage.update({
          where: { id: replacementCover.id },
          data: { is_cover: true },
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

    await this.ensureSingleCover(itemId, updated.is_cover ? updated.id : undefined);

    return { image: this.mapImage(updated) };
  }

  async reorderImages(itemId: string, reorderDto: ReorderImagesDto) {
    if (new Set(reorderDto.image_ids).size !== reorderDto.image_ids.length) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'Duplicate image IDs in reorder list',
      );
    }

    const allImages = await this.prisma.itemImage.findMany({
      where: { item_id: itemId },
      orderBy: { display_order: 'asc' },
    });
    const existingIds = new Set(allImages.map((img) => img.id));

    if (allImages.length !== reorderDto.image_ids.length) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'Reorder must include all item images',
      );
    }

    const hasUnknownId = reorderDto.image_ids.some((id) => !existingIds.has(id));
    if (hasUnknownId) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'Some image IDs do not belong to this item',
      );
    }

    // Perform reorder inside a transaction to avoid partial updates
    await this.prisma.$transaction(async (tx) => {
      for (let index = 0; index < reorderDto.image_ids.length; index++) {
        const id = reorderDto.image_ids[index];
        await tx.itemImage.update({
          where: { id },
          data: { display_order: index },
        });
      }
    });

    const preferredCoverId = allImages.find((img) => img.is_cover)?.id ?? reorderDto.image_ids[0];
    await this.ensureSingleCover(itemId, preferredCoverId);

    const updatedImages = await this.prisma.itemImage.findMany({
      where: { item_id: itemId },
      orderBy: { display_order: 'asc' },
    });

    return {
      images: updatedImages.map((img) => this.mapImage(img)),
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

    await this.prisma.itemImage.delete({
      where: { id: imageId },
    });

    try {
      await this.storage.deleteFile(image.file_path);
      if (image.thumbnail_path) {
        await this.storage.deleteFile(image.thumbnail_path);
      }
    } catch (error) {
      await this.prisma.itemImage.create({
        data: {
          id: image.id,
          item_id: image.item_id,
          file_path: image.file_path,
          thumbnail_path: image.thumbnail_path,
          is_cover: image.is_cover,
          display_order: image.display_order,
          created_at: image.created_at,
        },
      });
      throw error;
    }

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
    await this.ensureSingleCover(itemId);

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

  private mapImage(image: ItemImage) {
    return {
      id: image.id,
      item_id: image.item_id,
      url: this.storage.getFileUrl(image.file_path),
      thumbnail_url: image.thumbnail_path
        ? this.storage.getFileUrl(image.thumbnail_path)
        : null,
      is_cover: image.is_cover,
      display_order: image.display_order,
      created_at: image.created_at,
    };
  }

  private async cleanupSavedFiles(paths: string[]) {
    await Promise.all(
      paths.map(async (path) => {
        try {
          await this.storage.deleteFile(path);
        } catch {
          // Best-effort cleanup
        }
      }),
    );
  }

  private async ensureSingleCover(itemId: string, preferredImageId?: string) {
    const images = await this.prisma.itemImage.findMany({
      where: { item_id: itemId },
      orderBy: { display_order: 'asc' },
    });

    if (images.length === 0) {
      return;
    }

    const covers = images.filter((img) => img.is_cover);
    if (covers.length === 1) {
      return;
    }

    const preferred = preferredImageId
      ? images.find((img) => img.id === preferredImageId)
      : undefined;
    const nextCover = preferred ?? images[0];

    await this.prisma.itemImage.updateMany({
      where: { item_id: itemId },
      data: { is_cover: false },
    });
    await this.prisma.itemImage.update({
      where: { id: nextCover.id },
      data: { is_cover: true },
    });
  }
}

