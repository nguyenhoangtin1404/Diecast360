import { Controller, Post, UseInterceptors, UploadedFiles, Inject, BadRequestException, UseGuards, Logger } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { IStorageService } from '../storage/storage.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ShopRole } from '../generated/prisma/client';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';

@Controller('items/ai-draft')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(ShopRole.shop_admin, ShopRole.shop_staff)
export class AiDraftController {
  private readonly logger = new Logger(AiDraftController.name);

  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
    @Inject('IStorageService') private readonly storage: IStorageService,
  ) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @UseInterceptors(FilesInterceptor('images', 10)) // max 10 files
  async createDraft(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @CurrentTenantId() tenantId: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    // Validate each file manually
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      if (!allowedMimes.includes(file.mimetype)) {
        throw new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed: png, jpeg, jpg, webp`);
      }
      if (file.size > maxSize) {
        throw new BadRequestException(`File ${file.originalname} exceeds 10MB limit`);
      }
    }

    // 1. Analyze
    const analysis = await this.aiService.analyzeImages(files.map(f => f.buffer));

    const savedPaths: string[] = [];

    try {
      // 2. Save images to storage
      const imageUrls: string[] = [];
      for (const [index, file] of files.entries()) {
        const filename = this.buildDraftFilename(file.originalname, index, tenantId);
        const path = await this.storage.saveFile(file.buffer, filename, 'drafts');
        savedPaths.push(path);
        imageUrls.push(this.storage.getFileUrl(path));
      }

      // 3. Save Draft to DB
      const draft = await this.prisma.aiItemDraft.create({
        data: {
          images_json: JSON.stringify(imageUrls),
          extracted_text: analysis.extracted_text,
          ai_json: JSON.stringify(analysis.aiJson),
          confidence_json: JSON.stringify(analysis.confidence),
          status: 'PENDING',
        },
      });

      return {
        draftId: draft.id,
        aiJson: analysis.aiJson,
        confidence: analysis.confidence,
        images: imageUrls,
      };
    } catch (error) {
      await Promise.all(
        savedPaths.map(async (path) => {
          try {
            await this.storage.deleteFile(path);
          } catch (cleanupError) {
            const message = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
            this.logger.error(`Failed to cleanup draft file "${path}" after draft creation error: ${message}`);
          }
        }),
      );
      throw error;
    }
  }

  private buildDraftFilename(originalName: string, index: number, tenantId: string): string {
    const tenantPrefix = tenantId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'tenant';
    const sanitized = originalName.replace(/[^a-zA-Z0-9.]/g, '_');
    return `draft_${tenantPrefix}_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 10)}_${sanitized}`;
  }
}
