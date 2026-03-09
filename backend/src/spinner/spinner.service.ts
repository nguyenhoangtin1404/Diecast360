import { Injectable, Inject, Logger } from '@nestjs/common';
import { Prisma, SpinFrame } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { ImageProcessorService, WatermarkProcessingError } from '../image-processor/image-processor.service';
import { IStorageService } from '../storage/storage.interface';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { CreateSpinSetDto } from './dto/create-spin-set.dto';
import { UpdateSpinSetDto } from './dto/update-spin-set.dto';
import { UploadFrameDto } from './dto/upload-frame.dto';
import { ReorderFramesDto } from './dto/reorder-frames.dto';
import { isPrismaUniqueConstraintError } from '../common/prisma/prisma-error.utils';

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
  ) {
    const parsed = Number.parseInt(process.env.MAX_SPINNER_FRAMES || '48', 10);
    this.maxFrames = Number.isFinite(parsed) && parsed > 0 ? parsed : 48;
    this.allowedMimeTypes = (process.env.ALLOWED_MIME || 'image/jpeg,image/png')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    const maxUploadMB = Number.parseInt(process.env.MAX_UPLOAD_MB || '10', 10);
    if (!Number.isFinite(maxUploadMB) || maxUploadMB <= 0) {
      throw new Error('Invalid MAX_UPLOAD_MB config');
    }
    this.maxUploadBytes = maxUploadMB * 1024 * 1024;
  }

  async getSpinSets(itemId: string) {
    const spinSets = await this.prisma.spinSet.findMany({
      where: { item_id: itemId },
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

  async createSpinSet(itemId: string, createDto: CreateSpinSetDto) {
    // Validate item exists
    const item = await this.prisma.item.findFirst({
      where: { id: itemId, deleted_at: null },
    });

    if (!item) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Item not found');
    }

    // If setting as default, unset other defaults
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

  async updateSpinSet(spinSetId: string, updateDto: UpdateSpinSetDto) {
    const spinSet = await this.prisma.spinSet.findUnique({
      where: { id: spinSetId },
      include: { item: true },
    });

    if (!spinSet) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Spin set not found');
    }

    const updateData: any = {};

    if (updateDto.label !== undefined) {
      updateData.label = updateDto.label;
    }

    if (updateDto.is_default !== undefined) {
      if (updateDto.is_default) {
        // Unset other defaults for this item
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
  ) {
    // Validate spin set exists
    const spinSet = await this.prisma.spinSet.findUnique({
      where: { id: spinSetId },
    });

    if (!spinSet) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Spin set not found');
    }

    // Fast-fail check for common case; transaction-level guard in insertFrameWithOrdering is authoritative.
    const existingCount = await this.prisma.spinFrame.count({
      where: { spin_set_id: spinSetId },
    });
    if (existingCount >= this.maxFrames) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        `Cannot upload more than ${this.maxFrames} frames`,
      );
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
          'Không thể xử lý watermark cho khung quay. Vui lòng thử ảnh khác.',
        );
      }
      throw error;
    }
    const thumbnail = await this.imageProcessor.generateThumbnail(file.buffer);

    // Generate filenames
    const imageFilename = this.imageProcessor.generateFilename(file.originalname);
    const thumbnailFilename = this.imageProcessor.generateFilename(file.originalname);

    const savedPaths: string[] = [];
    try {
      const imagePath = await this.storage.saveFile(
        processedImage,
        imageFilename,
        'spinner',
      );
      savedPaths.push(imagePath);

      const thumbnailPath = await this.storage.saveFile(
        thumbnail,
        `thumb_${thumbnailFilename}`,
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

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
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
              throw new AppException(
                ErrorCode.VALIDATION_ERROR,
                'frame_index must be >= 0',
              );
            }

            // Cap to end-of-list when index is too large
            targetIndex = Math.min(requestedIndex, frameCount);

            // Shift existing frames to make room for inserted index
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
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        // Retry on unique constraint collision due to concurrency
        if (isPrismaUniqueConstraintError(error) && attempt < maxAttempts - 1) {
          await this.delayBeforeRetry(attempt);
          continue;
        }

        throw error;
      }
    }

    // Should never reach here, but included for type safety
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
      thumbnail_url: frame.thumbnail_path
        ? this.storage.getFileUrl(frame.thumbnail_path)
        : null,
      created_at: frame.created_at,
    };
  }

  private async cleanupSavedFiles(paths: string[], context: string) {
    await Promise.all(
      paths.map(async (path) => {
        try {
          await this.storage.deleteFile(path);
        } catch (error) {
          this.logger.warn(`[${context}] Failed to cleanup file: ${path}`, error as Error);
        }
      }),
    );
  }

  async reorderFrames(spinSetId: string, reorderDto: ReorderFramesDto) {
    // Validate spin set exists
    const spinSet = await this.prisma.spinSet.findUnique({
      where: { id: spinSetId },
    });

    if (!spinSet) {
      throw new AppException(ErrorCode.NOT_FOUND, 'Spin set not found');
    }

    // Validate all frames belong to this spin set
    const frames = await this.prisma.spinFrame.findMany({
      where: {
        spin_set_id: spinSetId,
        id: { in: reorderDto.frame_ids },
      },
    });

    if (frames.length !== reorderDto.frame_ids.length) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'Some frame IDs do not belong to this spin set',
      );
    }

    // Get all frames for this spin set to check completeness
    const allFrames = await this.prisma.spinFrame.findMany({
      where: { spin_set_id: spinSetId },
    });

    if (allFrames.length !== reorderDto.frame_ids.length) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'Reorder must include all frames',
      );
    }

    // Check for duplicates
    if (new Set(reorderDto.frame_ids).size !== reorderDto.frame_ids.length) {
      throw new AppException(
        ErrorCode.VALIDATION_ERROR,
        'Duplicate frame IDs in reorder list',
      );
    }

    // Use a transaction to update frames safely
    // Because of the unique constraint on [spin_set_id, frame_index], we can't simply direct update
    // e.g. swapping 0 and 1 -> updating 0 to 1 fails because 1 exists
    // Strategy:
    // 1. Update all to temporary negative indices: -1, -2, -3...
    // 2. Update to new correct positive indices: 0, 1, 2...
    
    const updatedFrames = await this.prisma.$transaction(async (tx) => {
      // Step 1: Set to temporary negative indices to free up the positive range
      // Map id -> final_index
      const idToIndexMap = new Map<string, number>();
      reorderDto.frame_ids.forEach((id, index) => {
        idToIndexMap.set(id, index);
      });

      // Update each frame to a temporary negative index based on its current position to ensure uniqueness
      // We use -(index + 1) to ensure they are all negative and unique: -1, -2, -3...
      for (const frame of allFrames) {
        await tx.spinFrame.update({
          where: { id: frame.id },
          data: { frame_index: -1 * (frame.frame_index + 1) }, 
        });
      }

      // Step 2: Update to final desired indices
      for (const frameId of reorderDto.frame_ids) {
        const newIndex = idToIndexMap.get(frameId);
        if (newIndex === undefined) continue;

        await tx.spinFrame.update({
          where: { id: frameId },
          data: { frame_index: newIndex },
        });
      }
      return tx.spinFrame.findMany({
        where: { spin_set_id: spinSetId },
        orderBy: { frame_index: 'asc' },
      });
    });

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
  }

  async deleteFrame(spinSetId: string, frameId: string) {
    const frame = await this.prisma.spinFrame.findFirst({
      where: {
        id: frameId,
        spin_set_id: spinSetId,
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
        orderBy: { frame_index: 'asc' },
      });

      await Promise.all(
        remainingFrames.map((f, index) =>
          tx.spinFrame.update({
            where: { id: f.id },
            data: { frame_index: index },
          }),
        ),
      );
    });

    const pathsToCleanup = [frame.file_path];
    if (frame.thumbnail_path) {
      pathsToCleanup.push(frame.thumbnail_path);
    }
    await this.cleanupSavedFiles(pathsToCleanup, `deleteFrame:spinSetId=${spinSetId}`);

    return {};
  }

  private validateFile(file: Express.Multer.File) {
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new AppException(
        ErrorCode.UPLOAD_INVALID_TYPE,
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }

    if (file.size > this.maxUploadBytes) {
      throw new AppException(
        ErrorCode.UPLOAD_TOO_LARGE,
        `File size exceeds maximum of ${Math.floor(this.maxUploadBytes / (1024 * 1024))}MB`,
      );
    }
  }

  private async delayBeforeRetry(attempt: number) {
    const delayMs = Math.pow(2, attempt) * 50 + Math.random() * 50;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

