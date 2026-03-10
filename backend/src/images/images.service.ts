import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma, ItemImage } from '../generated/prisma/client';
import {
  ImageProcessorService,
  WatermarkProcessingError,
} from '../image-processor/image-processor.service';
import { IStorageService } from '../storage/storage.interface';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { UpdateImageDto } from './dto/update-image.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import {
  isPrismaRetryableTransactionError,
  isPrismaUniqueConstraintError,
} from '../common/prisma/prisma-error.utils';
import { UploadSupportService } from '../common/upload/upload-support.service';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);
  private readonly allowedMimeTypes: string[];
  private readonly maxUploadBytes: number;

  constructor(
    private prisma: PrismaService,
    private imageProcessor: ImageProcessorService,
    @Inject('IStorageService') private storage: IStorageService,
    private uploadSupport: UploadSupportService,
  ) {
    this.allowedMimeTypes = this.uploadSupport.resolveAllowedMimeTypes(this.logger);
    this.maxUploadBytes = this.uploadSupport.resolveMaxUploadBytes(this.logger, 10);
  }

  async uploadImage(itemId: string, file: Express.Multer.File, isCover?: boolean) {
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, deleted_at: null },
    });

    if (!item) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
    }

    await this.validateFile(file);

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
    const baseFilename = this.imageProcessor.generateFilename(file.originalname);
    const imageFilename = `img_${baseFilename}`;
    const thumbnailFilename = `thumb_${baseFilename}`;

    const savedPaths: string[] = [];
    try {
      const imagePath = await this.storage.saveFile(processedImage, imageFilename, 'images');
      savedPaths.push(imagePath);

      const thumbnailPath = await this.storage.saveFile(
        thumbnail,
        thumbnailFilename,
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
      await this.cleanupSavedFiles(savedPaths, `uploadImage:itemId=${itemId}`);
      throw error;
    }
  }

  private async insertImageWithOrdering(
    itemId: string,
    imagePath: string,
    thumbnailPath: string,
    isCover: boolean,
  ): Promise<ItemImage> {
    const maxAttempts = 3;
    let exhaustedRetry = false;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const imageCount = await tx.itemImage.count({ where: { item_id: itemId } });

            let existingCover: Pick<ItemImage, 'id'> | null = null;
            if (!isCover && imageCount > 0) {
              existingCover = await tx.itemImage.findFirst({
                where: { item_id: itemId, is_cover: true },
                select: { id: true },
              });
            }

            const displayOrder = imageCount;
            const shouldSetCover = Boolean(isCover || imageCount === 0 || !existingCover);

            if (shouldSetCover) {
              await tx.itemImage.updateMany({
                where: { item_id: itemId, is_cover: true },
                data: { is_cover: false },
              });
            }

            return tx.itemImage.create({
              data: {
                item_id: itemId,
                file_path: imagePath,
                thumbnail_path: thumbnailPath,
                is_cover: shouldSetCover,
                display_order: displayOrder,
              },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        const shouldRetry =
          isPrismaUniqueConstraintError(error) || isPrismaRetryableTransactionError(error);

        if (shouldRetry) {
          if (attempt < maxAttempts - 1) {
            await this.delayBeforeRetry(attempt);
            continue;
          }

          exhaustedRetry = true;
          break;
        }

        throw error;
      }
    }

    if (!exhaustedRetry) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'Unable to upload image');
    }

    throw new AppException(
      ErrorCode.VALIDATION_ERROR,
      'Unable to upload image due to concurrency conflict',
    );
  }

  async updateImage(itemId: string, imageId: string, updateDto: UpdateImageDto) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const image = await tx.itemImage.findFirst({
        where: {
          id: imageId,
          item_id: itemId,
        },
      });

      if (!image) {
        throw new AppException(ErrorCode.NOT_FOUND, 'Image not found');
      }

      const updateData: Prisma.ItemImageUpdateInput = {};
      let preferredCoverId: string | undefined;

      if (updateDto.is_cover !== undefined) {
        if (updateDto.is_cover) {
          await tx.itemImage.updateMany({
            where: { item_id: itemId, is_cover: true },
            data: { is_cover: false },
          });
        } else if (image.is_cover) {
          const replacementCover = await tx.itemImage.findFirst({
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

          await tx.itemImage.update({
            where: { id: replacementCover.id },
            data: { is_cover: true },
          });
          preferredCoverId = replacementCover.id;
        }
        updateData.is_cover = updateDto.is_cover;
      }

      if (updateDto.display_order !== undefined) {
        updateData.display_order = updateDto.display_order;
      }

      const nextImage = await tx.itemImage.update({
        where: { id: imageId },
        data: updateData,
      });

      await this.ensureSingleCover(tx, itemId, nextImage.is_cover ? nextImage.id : preferredCoverId);
      return nextImage;
    });

    return { image: this.mapImage(updated) };
  }

  async reorderImages(itemId: string, reorderDto: ReorderImagesDto) {
    if (new Set(reorderDto.image_ids).size !== reorderDto.image_ids.length) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'Duplicate image IDs in reorder list');
    }

    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const updatedImages = await this.prisma.$transaction(
          async (tx) => {
            const allImages = await tx.itemImage.findMany({
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

            await this.reorderItemImagesSafely(tx, allImages, reorderDto.image_ids);

            const indexById = new Map<string, number>();
            reorderDto.image_ids.forEach((id, index) => {
              indexById.set(id, index);
            });

            const reorderedImages = allImages
              .map((img) => ({ ...img, display_order: indexById.get(img.id) ?? img.display_order }))
              .sort((a, b) => a.display_order - b.display_order);

            return this.ensureSingleCover(tx, itemId, undefined, reorderedImages);
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        return {
          images: updatedImages.map((img) => this.mapImage(img)),
        };
      } catch (error) {
        const shouldRetry =
          isPrismaUniqueConstraintError(error) || isPrismaRetryableTransactionError(error);

        if (shouldRetry && attempt < maxAttempts - 1) {
          await this.delayBeforeRetry(attempt);
          continue;
        }

        throw error;
      }
    }

    throw new AppException(
      ErrorCode.VALIDATION_ERROR,
      'Unable to reorder images due to concurrency conflict',
    );
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

    await this.prisma.$transaction(async (tx) => {
      await tx.itemImage.delete({
        where: { id: imageId },
      });

      const remainingImages = await tx.itemImage.findMany({
        where: { item_id: itemId },
        orderBy: { display_order: 'asc' },
      });

      const orderedIds = remainingImages.map((img) => img.id);
      await this.reorderItemImagesSafely(tx, remainingImages, orderedIds);

      const normalized = remainingImages.map((img, index) => ({
        ...img,
        display_order: index,
      }));

      await this.ensureSingleCover(tx, itemId, undefined, normalized);
    });

    const pathsToCleanup = [image.file_path];
    if (image.thumbnail_path) {
      pathsToCleanup.push(image.thumbnail_path);
    }
    await this.cleanupSavedFiles(pathsToCleanup, `deleteImage:itemId=${itemId}`);

    return {};
  }

  private async reorderItemImagesSafely(
    tx: Prisma.TransactionClient,
    allImages: Pick<ItemImage, 'id'>[],
    orderedIds: string[],
  ) {
    await Promise.all(
      allImages.map((img, index) =>
        tx.itemImage.update({
          where: { id: img.id },
          data: { display_order: -1 * (index + 1) },
        }),
      ),
    );

    await Promise.all(
      orderedIds.map((id, index) =>
        tx.itemImage.update({
          where: { id },
          data: { display_order: index },
        }),
      ),
    );
  }

  private async validateFile(file: Express.Multer.File) {
    await this.uploadSupport.validateFile(file, this.allowedMimeTypes, this.maxUploadBytes);
  }

  private mapImage(image: ItemImage) {
    return {
      id: image.id,
      item_id: image.item_id,
      url: this.storage.getFileUrl(image.file_path),
      thumbnail_url: image.thumbnail_path ? this.storage.getFileUrl(image.thumbnail_path) : null,
      is_cover: image.is_cover,
      display_order: image.display_order,
      created_at: image.created_at,
    };
  }

  private async cleanupSavedFiles(paths: string[], context: string) {
    await this.uploadSupport.cleanupSavedFiles(this.storage, this.logger, paths, context);
  }

  private async ensureSingleCover(
    tx: Prisma.TransactionClient,
    itemId: string,
    preferredImageId?: string,
    preloadedImages?: ItemImage[],
  ): Promise<ItemImage[]> {
    const mustReturnFreshState = preloadedImages !== undefined;
    const images =
      preloadedImages ??
      (await tx.itemImage.findMany({
        where: { item_id: itemId },
        orderBy: { display_order: 'asc' },
      }));

    if (images.length === 0) return images;

    const covers = images.filter((img) => img.is_cover);
    if (covers.length === 1) {
      if (!mustReturnFreshState) return images;
      return tx.itemImage.findMany({
        where: { item_id: itemId },
        orderBy: { display_order: 'asc' },
      });
    }

    const preferred = preferredImageId ? images.find((img) => img.id === preferredImageId) : undefined;
    if (preferredImageId && !preferred) {
      this.logger.warn(`Preferred cover image not found: ${preferredImageId} for item ${itemId}`);
    }

    const nextCover = preferred ?? covers[0] ?? images[0];

    await tx.itemImage.updateMany({
      where: { item_id: itemId },
      data: { is_cover: false },
    });
    await tx.itemImage.update({
      where: { id: nextCover.id },
      data: { is_cover: true },
    });

    return tx.itemImage.findMany({
      where: { item_id: itemId },
      orderBy: { display_order: 'asc' },
    });
  }

  private async delayBeforeRetry(attempt: number) {
    await this.uploadSupport.delayBeforeRetry(attempt);
  }
}
