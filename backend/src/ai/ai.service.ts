import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { AiDescriptionResponseDto } from './dto/ai-description.dto';
import { AiAnalysisResult } from '../items/dto/ai-draft.dto';
import { AiDescriptionService } from './services/ai-description.service';
import { AiFacebookService } from './services/ai-facebook.service';
import { AiImageService } from './services/ai-image.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private readonly descriptionService: AiDescriptionService;
  private readonly facebookService: AiFacebookService;
  private readonly imageService: AiImageService;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured. AI features will not work.');
    }
    const openai = new OpenAI({ apiKey: apiKey || 'not-configured' });

    this.descriptionService = new AiDescriptionService(prisma, configService, openai);
    this.facebookService = new AiFacebookService(prisma, configService, openai);
    this.imageService = new AiImageService(configService, openai);
  }

  async generateItemDescription(
    itemId: string,
    tenantId: string,
    customInstructions?: string,
  ): Promise<AiDescriptionResponseDto> {
    this.ensureApiKeyConfigured();
    return this.descriptionService.generateItemDescription(itemId, tenantId, customInstructions);
  }

  async generateFacebookPost(
    itemId: string,
    tenantId: string,
    customInstructions?: string,
  ): Promise<{ content: string }> {
    this.ensureApiKeyConfigured();
    return this.facebookService.generateFacebookPost(itemId, tenantId, customInstructions);
  }

  async analyzeImages(
    imageBuffers: Buffer[],
    context?: { shop_id?: string; op?: string },
  ): Promise<AiAnalysisResult> {
    this.ensureApiKeyConfigured();
    return this.imageService.analyzeImages(imageBuffers, context);
  }

  private ensureApiKeyConfigured() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'OpenAI API key not configured');
    }
  }
}
