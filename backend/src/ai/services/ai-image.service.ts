import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AppException, ErrorCode } from '../../common/exceptions/http-exception.filter';
import { AiAnalysisResult } from '../../items/dto/ai-draft.dto';

@Injectable()
export class AiImageService {
  private readonly logger = new Logger(AiImageService.name);

  constructor(
    private configService: ConfigService,
    private openai: OpenAI,
  ) {}

  async analyzeImages(
    imageBuffers: Buffer[],
    context?: { shop_id?: string; op?: string },
  ): Promise<AiAnalysisResult> {
    const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    if (context?.shop_id) {
      this.logger.log(
        `ai.openai_call op=${context.op ?? 'image_analyze'} shop_id=${context.shop_id} model=${model} images=${imageBuffers.length}`,
      );
    }

    const imageMessages = imageBuffers.map(buffer => ({
      type: 'image_url' as const,
      image_url: {
        url: `data:image/jpeg;base64,${buffer.toString('base64')}`,
      },
    }));

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `Bạn là chuyên gia về mô hình xe (diecast). Nhiệm vụ của bạn là phân tích hình ảnh và trích xuất thông tin chi tiết về sản phẩm.

            Hãy trích xuất các thông tin sau:
            - Brand (Thương hiệu mô hình / nhà sản xuất diecast, ví dụ: Hot Wheels, Mini GT, Tarmac Works, Tomica, Inno64, ...)
            - Car Brand (Hãng xe thật của mẫu được mô phỏng, ví dụ: Nissan, Lamborghini, Ferrari, ...)
            - Model Brand (Dòng xe / mẫu xe thật, ví dụ: GT-R R35, Aventador SVJ — không nhầm với Brand diecast phía trên)
            - Scale (Tỷ lệ, ví dụ: 1:64, 1:43, 1:18, ...). Nếu không chắc chắn, hãy đoán dựa trên kích thước phổ biến (thường là 1:64 nếu là Hot Wheels/Mini GT).
            - Color (Màu sắc chủ đạo)
            - Product Code (Mã sản phẩm nếu thấy trên bao bì)

            Trả về JSON format chuẩn:
            {
              "aiJson": {
                "brand": "...",
                "car_brand": "...",
                "model_brand": "...",
                "scale": "...",
                "color": "...",
                "product_code": "..."
              },
              "confidence": {
                "brand": 0.9,
                "model_name": 0.8,
                "scale": 0.6
              },
              "extracted_text": "Toàn bộ text đọc được từ bao bì (OCR)"
            }`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Phân tích các hình ảnh này và trích xuất thông tin sản phẩm diecast:' },
              ...imageMessages,
            ],
          },
        ],
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      return this.parseImageAnalysisResponse(completion.choices[0]?.message?.content);

    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      this.logger.error('OpenAI Vision Error', error instanceof Error ? error.stack : String(error));
      throw this.mapProviderError(error, 'Failed to analyze images');
    }
  }

  private parseImageAnalysisResponse(content: string | null | undefined): AiAnalysisResult {
    const parsed = this.parseJsonObject(content, 'AI did not return a valid image analysis payload') as {
      aiJson?: Record<string, unknown>;
      confidence?: unknown;
      extracted_text?: unknown;
    };

    if (!parsed.aiJson || typeof parsed.aiJson !== 'object') {
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, 'AI returned incomplete image analysis');
    }

    if (parsed.confidence !== undefined && (!parsed.confidence || typeof parsed.confidence !== 'object' || Array.isArray(parsed.confidence))) {
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, 'AI returned malformed image analysis confidence');
    }

    if (parsed.extracted_text !== undefined && typeof parsed.extracted_text !== 'string') {
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, 'AI returned malformed extracted text');
    }

    return {
      aiJson: parsed.aiJson as AiAnalysisResult['aiJson'],
      confidence: this.normalizeConfidenceMap(parsed.confidence as Record<string, unknown> | undefined),
      extracted_text: typeof parsed.extracted_text === 'string' ? parsed.extracted_text : '',
    };
  }

  private parseJsonObject(content: string | null | undefined, malformedMessage: string): Record<string, unknown> {
    if (!content || !content.trim()) {
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, 'AI did not return content');
    }

    const trimmed = content.trim();
    const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```/i);
    const normalized = (fencedMatch?.[1] ?? trimmed).trim();

    try {
      const parsed = JSON.parse(normalized) as unknown;
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, malformedMessage);
      }
      return parsed as Record<string, unknown>;
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, malformedMessage);
    }
  }

  private normalizeConfidenceMap(confidence: Record<string, unknown> | undefined): Record<string, number> {
    if (!confidence || typeof confidence !== 'object') {
      return {};
    }

    return Object.entries(confidence).reduce<Record<string, number>>((acc, [key, value]) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

  private mapProviderError(error: unknown, fallbackMessage: string): AppException {
    const providerError = this.getProviderError(error);

    if (providerError?.status === 429) {
      return new AppException(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        'AI rate limit exceeded. Please try again later.',
      );
    }

    if (providerError?.status && providerError.status >= 400 && providerError.status < 500) {
      return new AppException(
        ErrorCode.VALIDATION_ERROR,
        'Invalid AI request. Please review the input and try again.',
      );
    }

    return new AppException(ErrorCode.INTERNAL_SERVER_ERROR, fallbackMessage);
  }

  private getProviderError(error: unknown): { status?: number; message?: string } {
    if (!error || typeof error !== 'object') {
      return {};
    }

    const candidate = error as Record<string, unknown>;

    return {
      status: typeof candidate.status === 'number' ? candidate.status : undefined,
      message: typeof candidate.message === 'string' ? candidate.message : undefined,
    };
  }
}
