import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ImageProcessorService } from '../image-processor/image-processor.service';
import { IStorageService } from '../storage/storage.interface';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { CreateSpinSetDto } from './dto/create-spin-set.dto';
import { UpdateSpinSetDto } from './dto/update-spin-set.dto';
import { UploadFrameDto } from './dto/upload-frame.dto';
import { ReorderFramesDto } from './dto/reorder-frames.dto';

@Injectable()
export class SpinnerService {
  constructor(
    private prisma: PrismaService,
    private imageProcessor: ImageProcessorService,
    @Inject('IStorageService') private storage: IStorageService,
  ) {}

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

    // Validate file
    this.validateFile(file);

    // Process image and generate thumbnail
    const processedImage = await this.imageProcessor.processImage(file.buffer);
    const thumbnail = await this.imageProcessor.generateThumbnail(file.buffer);

    // Generate filenames
    const imageFilename = this.imageProcessor.generateFilename(file.originalname);
    const thumbnailFilename = this.imageProcessor.generateFilename(file.originalname);

    // Save files
    const imagePath = await this.storage.saveFile(
      processedImage,
      imageFilename,
      'spinner',
    );
    const thumbnailPath = await this.storage.saveFile(
      thumbnail,
      `thumb_${thumbnailFilename}`,
      'spinner/thumbnails',
    );

    // Determine frame_index
    let frameIndex: number;
    if (uploadDto.frame_index !== undefined) {
      // Check if frame_index already exists
      const existing = await this.prisma.spinFrame.findFirst({
        where: {
          spin_set_id: spinSetId,
          frame_index: uploadDto.frame_index,
        },
      });

      if (existing) {
        throw new AppException(
          ErrorCode.SPIN_FRAME_INDEX_CONFLICT,
          `Frame index ${uploadDto.frame_index} already exists`,
        );
      }

      frameIndex = uploadDto.frame_index;
    } else {
      // Append at the end
      const maxFrame = await this.prisma.spinFrame.findFirst({
        where: { spin_set_id: spinSetId },
        orderBy: { frame_index: 'desc' },
        select: { frame_index: true },
      });

      frameIndex = maxFrame ? maxFrame.frame_index + 1 : 0;
    }

    // Create frame
    const frame = await this.prisma.spinFrame.create({
      data: {
        spin_set_id: spinSetId,
        frame_index: frameIndex,
        file_path: imagePath,
        thumbnail_path: thumbnailPath,
      },
    });

    return {
      frame: {
        id: frame.id,
        spin_set_id: frame.spin_set_id,
        frame_index: frame.frame_index,
        image_url: this.storage.getFileUrl(frame.file_path),
        thumbnail_url: this.storage.getFileUrl(frame.thumbnail_path),
        created_at: frame.created_at,
      },
    };
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

    // Update frame_index starting from 0
    const updates = reorderDto.frame_ids.map((id, index) =>
      this.prisma.spinFrame.update({
        where: { id },
        data: { frame_index: index },
      }),
    );

    await Promise.all(updates);

    // Get updated frames
    const updatedFrames = await this.prisma.spinFrame.findMany({
      where: { spin_set_id: spinSetId },
      orderBy: { frame_index: 'asc' },
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

    // Delete file and thumbnail
    await this.storage.deleteFile(frame.file_path);
    if (frame.thumbnail_path) {
      await this.storage.deleteFile(frame.thumbnail_path);
    }

    // Delete frame
    await this.prisma.spinFrame.delete({
      where: { id: frameId },
    });

    // Reorder remaining frames to be contiguous starting from 0
    const remainingFrames = await this.prisma.spinFrame.findMany({
      where: { spin_set_id: spinSetId },
      orderBy: { frame_index: 'asc' },
    });

    await Promise.all(
      remainingFrames.map((f, index) =>
        this.prisma.spinFrame.update({
          where: { id: f.id },
          data: { frame_index: index },
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

