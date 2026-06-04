import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Item } from '../../generated/prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toNumber } from '../../common/utils/decimal.utils';
import { AppException, ErrorCode } from '../../common/exceptions/http-exception.filter';
import { AiDescriptionResponseDto } from '../dto/ai-description.dto';

@Injectable()
export class AiDescriptionService {
  private readonly logger = new Logger(AiDescriptionService.name);

  private static readonly CUSTOM_INSTRUCTIONS_MAX = 2000;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private openai: OpenAI,
  ) {}

  async generateItemDescription(
    itemId: string,
    tenantId: string,
    customInstructions?: string,
  ): Promise<AiDescriptionResponseDto> {
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

    const prompt = this.buildPrompt(item, this.clampCustomInstructions(customInstructions));

    try {
      const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
      this.logger.log(
        `ai.openai_call op=description shop_id=${tenantId} item_id=${itemId} model=${model}`,
      );
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `Bạn là chuyên gia viết nội dung bán hàng cho diecast/xe mô hình. Nhiệm vụ của bạn là tạo nội dung SEO chất lượng cao cho sản phẩm.

Quy tắc quan trọng:
- KHÔNG bịa thông tin không có trong dữ liệu
- Nếu field nào null/empty, KHÔNG đề cập đến field đó
- Tone: collector/shop chuyên nghiệp, hấp dẫn nhưng trung thực
- Viết bằng tiếng Việt

Trả về JSON với format sau (KHÔNG có markdown code block):
{
  "short_description": "Mô tả ngắn 50-80 từ cho Facebook post",
  "long_description": "Mô tả chi tiết 150-200 từ cho website",
  "bullet_specs": ["Điểm 1", "Điểm 2", "Điểm 3", "Điểm 4", "Điểm 5"],
  "meta_title": "Tiêu đề SEO (tối đa 60 ký tự)",
  "meta_description": "Mô tả SEO (tối đa 155 ký tự)"
}`
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      return this.parseDescriptionResponse(completion.choices[0]?.message?.content);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      this.logger.error('OpenAI API error', error instanceof Error ? error.stack : String(error));
      throw this.mapProviderError(error, 'Failed to generate AI description');
    }
  }

  private buildPrompt(item: Item, customInstructions?: string): string {
    const itemData: string[] = [];

    if (item.name) itemData.push(`Tên sản phẩm: ${item.name}`);
    if (item.brand) itemData.push(`Hãng mô hình: ${item.brand}`);
    if (item.car_brand) itemData.push(`Hãng xe: ${item.car_brand}`);
    if (item.model_brand) itemData.push(`Dòng xe: ${item.model_brand}`);
    if (item.scale) itemData.push(`Tỷ lệ: ${item.scale}`);
    if (item.condition) {
      const conditionText = item.condition === 'new' ? 'Mới' : 'Đã qua sử dụng';
      itemData.push(`Tình trạng: ${conditionText}`);
    }
    if (item.price != null) {
      const priceVal = toNumber(item.price);
      if (priceVal !== null) {
        itemData.push(`Giá: ${priceVal.toLocaleString('vi-VN')} VND`);
      }
    }
    if (item.original_price != null) {
      const origPriceVal = toNumber(item.original_price);
      if (origPriceVal !== null) {
        itemData.push(`Giá gốc: ${origPriceVal.toLocaleString('vi-VN')} VND`);
      }
    }
    if (item.description) itemData.push(`Mô tả hiện tại: ${item.description}`);

    let prompt = `Tạo nội dung SEO cho sản phẩm diecast sau:\n\n${itemData.join('\n')}`;

    if (customInstructions) {
      prompt += `\n\nYêu cầu bổ sung từ người dùng: ${customInstructions}`;
    }

    return prompt;
  }

  private clampCustomInstructions(raw?: string): string | undefined {
    if (raw == null || typeof raw !== 'string') {
      return undefined;
    }
    const t = raw.trim();
    if (!t) return undefined;
    if (t.length <= AiDescriptionService.CUSTOM_INSTRUCTIONS_MAX) {
      return t;
    }
    return t.slice(0, AiDescriptionService.CUSTOM_INSTRUCTIONS_MAX);
  }

  private parseDescriptionResponse(content: string | null | undefined): AiDescriptionResponseDto {
    const parsed = this.parseJsonObject(content, 'AI did not return a valid description payload') as Partial<AiDescriptionResponseDto>;
    const normalizedBulletSpecs = Array.isArray(parsed.bullet_specs)
      ? parsed.bullet_specs.filter((spec): spec is string => typeof spec === 'string' && spec.trim().length > 0)
      : [];

    if (
      !parsed.short_description ||
      !parsed.long_description ||
      normalizedBulletSpecs.length === 0 ||
      !parsed.meta_title ||
      !parsed.meta_description
    ) {
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, 'AI returned incomplete content');
    }

    return {
      short_description: parsed.short_description,
      long_description: parsed.long_description,
      bullet_specs: normalizedBulletSpecs,
      meta_title: parsed.meta_title,
      meta_description: parsed.meta_description,
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
