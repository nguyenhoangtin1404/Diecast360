import { Injectable, Inject, Logger } from '@nestjs/common';
import { Prisma, SpinFrame } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  ImageProcessorService,
  WatermarkProcessingError,
} from '../image-processor/image-processor.service';
import { IStorageService } from '../storage/storage.interface';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { CreateSpinSetDto } from './dto/create-spin-set.dto';
import { UpdateSpinSetDto } from './dto/update-spin-set.dto';
import { UploadFrameDto } from './dto/upload-frame.dto';
import { ReorderFramesDto } from './dto/reorder-frames.dto';
import {
  isPrismaRetryableTransactionError,
  isPrismaUniqueConstraintError,
} from '../common/prisma/prisma-error.utils';
import { UploadSupportService } from '../common/upload/upload-support.service';

@Injectable()
export class SpinnerService {
  private readonly logger = new Logger(SpinnerService.name);
  private readonly maxFrames: number;
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
    this.maxFrames = this.uploadSupport.resolveMaxSpinnerFrames(this.logger, 48);
  }

  async getSpinSets(itemId: string, tenantId: string) {
    const spinSets = await this.prisma.spinSet.findMany({
      where: {
        item_id: itemId,
        item: { shop_id: tenantId },
      },
      include: {
        frames: {
          orderBy: { frame_index: 'asc' },
        },
      },
    });

    return {
      spin_sets: spinSets.map((set) => ({
        id: set.id,
        item_id: set.item_id,
        label: set.label,
        is_default: set.is_default,
        frames: set.frames.map((frame) => ({
          id: frame.id,
          spin_set_id: frame.spin_set_id,
          frame_index: frame.frame_index,
          image_url: this.storage.getFileUrl(frame.file_path),
          thumbnail_url: frame.thumbnail_path
            ? this.storage.getFileUrl(frame.thumbnail_path)
            : null,
          created_at: frame.created_at,
        })),
        created_at: set.created_at,
        updated_at: set.updated_at,
      })),
    };
  }

  async createSpinSet(itemId: string, createDto: CreateSpinSetDto, tenantId: string) {
    const item = await this.prisma.item.findFirst({
      where: {
        id: itemId,
        deleted_at: null,
        shop_id: tenantId,
      },
    });

    if (!item) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
    }

    if (createDto.is_default) {
      await this.prisma.spinSet.updateMany({
        where: { item_id: itemId, is_default: true },
        data: { is_default: false },
      });
    }

    const spinSet = await this.prisma.spinSet.create({
      data: {
        item_id: itemId,
        label: createDto.label,
        is_default: createDto.is_default || false,
      },
    });

    return {
      spin_set: {
        id: spinSet.id,
        item_id: spinSet.item_id,
        label: spinSet.label,
        is_default: spinSet.is_default,
        frames: [],
        created_at: spinSet.created_at,
        updated_at: spinSet.updated_at,
      },
    };
  }

  async updateSpinSet(spinSetId: string, updateDto: UpdateSpinSetDto, tenantId: string) {
    const spinSet = await this.prisma.spinSet.findFirst({
      where: {
        id: spinSetId,
        item: { shop_id: tenantId },
      },
      include: { item: true },
    });

    if (!spinSet) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Spin set not found');
    }

    const updateData: Prisma.SpinSetUpdateInput = {};

    if (updateDto.label !== undefined) {
      updateData.label = updateDto.label;
    }

    if (updateDto.is_default !== undefined) {
      if (updateDto.is_default) {
        await this.prisma.spinSet.updateMany({
          where: {
            item_id: spinSet.item_id,
            id: { not: spinSetId },
            is_default: true,
          },
          data: { is_default: false },
        });
      }
      updateData.is_default = updateDto.is_default;
    }

    const updated = await this.prisma.spinSet.update({
      where: { id: spinSetId },
      data: updateData,
      include: {
        frames: {
          orderBy: { frame_index: 'asc' },
        },
      },
    });

    return {
      spin_set: {
        id: updated.id,
        item_id: updated.item_id,
        label: updated.label,
        is_default: updated.is_default,
        frames: updated.frames.map((frame) => ({
          id: frame.id,
          spin_set_id: frame.spin_set_id,
          frame_index: frame.frame_index,
          image_url: this.storage.getFileUrl(frame.file_path),
          thumbnail_url: frame.thumbnail_path
            ? this.storage.getFileUrl(frame.thumbnail_path)
            : null,
          created_at: frame.created_at,
        })),
        created_at: updated.created_at,
        updated_at: updated.updated_at,
      },
    };
  }

  async uploadFrame(
    spinSetId: string,
    file: Express.Multer.File,
    uploadDto: UploadFrameDto,
    tenantId: string,
  ) {
    const spinSet = await this.prisma.spinSet.findFirst({
      where: {
        id: spinSetId,
        item: { shop_id: tenantId },
      },
    });

    if (!spinSet) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Spin set not found');
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
          'Không thể xử lý watermark cho khung quay. Vui lòng thử ảnh khác.',
        );
      }
      throw error;
    }

    const thumbnail = await this.imageProcessor.generateThumbnail(file.buffer);

    const baseFilename = this.imageProcessor.generateFilename(file.originalname);
    const imageFilename = `frame_${baseFilename}`;
    const thumbnailFilename = `thumb_${baseFilename}`;

    const savedPaths: string[] = [];
    try {
      const imagePath = await this.storage.saveFile(processedImage, imageFilename, 'spinner');
      savedPaths.push(imagePath);

      const thumbnailPath = await this.storage.saveFile(
        thumbnail,
        thumbnailFilename,
        'spinner/thumbnails',
      );
      savedPaths.push(thumbnailPath);

      const frame = await this.insertFrameWithOrdering(
        spinSetId,
        imagePath,
        thumbnailPath,
        uploadDto.frame_index,
      );

      return { frame: this.mapFrame(frame) };
    } catch (error) {
      await this.cleanupSavedFiles(savedPaths, `uploadFrame:spinSetId=${spinSetId}`);
      throw error;
    }
  }

  private async insertFrameWithOrdering(
    spinSetId: string,
    imagePath: string,
    thumbnailPath: string,
    requestedIndex?: number,
  ): Promise<SpinFrame> {
    const maxAttempts = 3;
    let exhaustedRetry = false;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const frameCount = await tx.spinFrame.count({
              where: { spin_set_id: spinSetId },
            });
            if (frameCount >= this.maxFrames) {
              throw new AppException(
                ErrorCode.VALIDATION_ERROR,
                `Cannot upload more than ${this.maxFrames} frames`,
              );
            }

            let targetIndex = frameCount;
            if (requestedIndex !== undefined) {
              if (requestedIndex < 0) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, 'frame_index must be >= 0');
              }

              targetIndex = Math.min(requestedIndex, frameCount);

              await tx.spinFrame.updateMany({
                where: {
                  spin_set_id: spinSetId,
                  frame_index: { gte: targetIndex },
                },
                data: { frame_index: { increment: 1 } },
              });
            }

            return tx.spinFrame.create({
              data: {
                spin_set_id: spinSetId,
                frame_index: targetIndex,
                file_path: imagePath,
                thumbnail_path: thumbnailPath,
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
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'Unable to upload frame');
    }

    throw new AppException(
      ErrorCode.VALIDATION_ERROR,
      'Unable to upload frame due to concurrency conflict',
    );
  }

  private mapFrame(frame: SpinFrame) {
    return {
      id: frame.id,
      spin_set_id: frame.spin_set_id,
      frame_index: frame.frame_index,
      image_url: this.storage.getFileUrl(frame.file_path),
      thumbnail_url: frame.thumbnail_path ? this.storage.getFileUrl(frame.thumbnail_path) : null,
      created_at: frame.created_at,
    };
  }

  private async cleanupSavedFiles(paths: string[], context: string) {
    await this.uploadSupport.cleanupSavedFiles(this.storage, this.logger, paths, context);
  }

  async reorderFrames(spinSetId: string, reorderDto: ReorderFramesDto, tenantId: string) {
    const spinSet = await this.prisma.spinSet.findFirst({
      where: {
        id: spinSetId,
        item: { shop_id: tenantId },
      },
    });

    if (!spinSet) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Spin set not found');
    }

    if (new Set(reorderDto.frame_ids).size !== reorderDto.frame_ids.length) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'Duplicate frame IDs in reorder list');
    }

    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const updatedFrames = await this.prisma.$transaction(
          async (tx) => {
            const allFrames = await tx.spinFrame.findMany({
              where: { spin_set_id: spinSetId },
              orderBy: { frame_index: 'asc' },
            });

            if (allFrames.length !== reorderDto.frame_ids.length) {
              throw new AppException(
                ErrorCode.VALIDATION_ERROR,
                'Reorder must include all frames',
              );
            }

            const existingIds = new Set(allFrames.map((frame) => frame.id));
            const hasUnknownId = reorderDto.frame_ids.some((id) => !existingIds.has(id));
            if (hasUnknownId) {
              throw new AppException(
                ErrorCode.VALIDATION_ERROR,
                'Some frame IDs do not belong to this spin set',
              );
            }

            await this.reorderSpinFramesSafely(tx, spinSetId, reorderDto.frame_ids);

            return tx.spinFrame.findMany({
              where: { spin_set_id: spinSetId },
              orderBy: { frame_index: 'asc' },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        return {
          frames: updatedFrames.map((frame) => ({
            id: frame.id,
            spin_set_id: frame.spin_set_id,
            frame_index: frame.frame_index,
            image_url: this.storage.getFileUrl(frame.file_path),
            thumbnail_url: frame.thumbnail_path
              ? this.storage.getFileUrl(frame.thumbnail_path)
              : null,
            created_at: frame.created_at,
          })),
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
      'Unable to reorder frames due to concurrency conflict',
    );
  }

  async deleteFrame(spinSetId: string, frameId: string, tenantId: string) {
    const frame = await this.prisma.spinFrame.findFirst({
      where: {
        id: frameId,
        spin_set_id: spinSetId,
        spin_set: { item: { shop_id: tenantId } },
      },
    });

    if (!frame) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Frame not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.spinFrame.delete({
        where: { id: frameId },
      });

      const remainingFrames = await tx.spinFrame.findMany({
        where: { spin_set_id: spinSetId },
      });

      await this.reorderSpinFramesSafely(
        tx,
        spinSetId,
        remainingFrames
          .sort((a, b) => a.frame_index - b.frame_index)
          .map((remainingFrame) => remainingFrame.id),
      );
    });

    const pathsToCleanup = [frame.file_path];
    if (frame.thumbnail_path) {
      pathsToCleanup.push(frame.thumbnail_path);
    }
    await this.cleanupSavedFiles(pathsToCleanup, `deleteFrame:spinSetId=${spinSetId}`);

    return {};
  }

  private async reorderSpinFramesSafely(
    tx: Prisma.TransactionClient,
    spinSetId: string,
    orderedFrameIds: string[],
  ) {
    await tx.$executeRaw(
      Prisma.sql`
        UPDATE "spin_frames"
        SET "frame_index" = -("frame_index" + 1)
        WHERE "spin_set_id" = ${spinSetId}
      `,
    );

    if (orderedFrameIds.length === 0) {
      return;
    }

    const values = orderedFrameIds.map((id, index) => Prisma.sql`(${id}::uuid, ${index})`);

    await tx.$executeRaw(
      Prisma.sql`
        UPDATE "spin_frames" AS sf
        SET "frame_index" = v.new_index
        FROM (VALUES ${Prisma.join(values)}) AS v(id, new_index)
        WHERE sf.id = v.id
          AND sf.spin_set_id = ${spinSetId}
      `,
    );
  }

  private async validateFile(file: Express.Multer.File) {
    await this.uploadSupport.validateFile(file, this.allowedMimeTypes, this.maxUploadBytes);
  }

  private async delayBeforeRetry(attempt: number) {
    await this.uploadSupport.delayBeforeRetry(attempt);
  }
}
