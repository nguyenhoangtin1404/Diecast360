import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { AiDescriptionResponseDto } from './dto/ai-description.dto';
import { AiAnalysisResult } from '../items/dto/ai-draft.dto';
import { AiDescriptionService } from './services/ai-description.service';
import { AiFacebookService } from './services/ai-facebook.service';
import { AiImageService } from './services/ai-image.service';

@Injectable()
export class AiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly descriptionService: AiDescriptionService,
    private readonly facebookService: AiFacebookService,
    private readonly imageService: AiImageService,
  ) {}

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
