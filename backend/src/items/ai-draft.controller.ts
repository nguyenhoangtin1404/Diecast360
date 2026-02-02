import { Controller, Post, UseInterceptors, UploadedFiles, Inject, Body, BadRequestException, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { IStorageService } from '../storage/storage.interface';

@Controller('items/ai-draft')
export class AiDraftController {
  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
    @Inject('IStorageService') private readonly storage: IStorageService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  async createDraft(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
      }),
    ) files: Array<Express.Multer.File>,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    // 1. Analyze
    const analysis = await this.aiService.analyzeImages(files.map(f => f.buffer));

    // 2. Save images to storage
    const imageUrls = await Promise.all(
      files.map(async (file) => {
        const filename = `draft_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const path = await this.storage.saveFile(file.buffer, filename, 'drafts');
        return this.storage.getFileUrl(path);
      })
    );

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
  }
}
