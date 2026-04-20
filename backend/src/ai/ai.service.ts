import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Item } from '../generated/prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { toNumber } from '../common/utils/decimal.utils';

import { AppException, ErrorCode } from '../common/exceptions/http-exception.filter';
import { AiDescriptionResponseDto } from './dto/ai-description.dto';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      console.warn('OPENAI_API_KEY not configured. AI features will not work.');
    }
    this.openai = new OpenAI({
      apiKey: apiKey || 'not-configured',
    });
  }

  async generateItemDescription(
    itemId: string,
    tenantId: string,
    customInstructions?: string,
  ): Promise<AiDescriptionResponseDto> {
    this.ensureApiKeyConfigured();

    // Fetch item data
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

    // Build prompt
    const prompt = this.buildPrompt(item, customInstructions);

    try {
      const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
      
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
      console.error('OpenAI API error:', error);
      throw this.mapProviderError(error, 'Failed to generate AI description');
    }
  }

  async generateFacebookPost(
    itemId: string,
    tenantId: string,
    customInstructions?: string,
  ): Promise<{ content: string }> {
    this.ensureApiKeyConfigured();

    // Fetch item data
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

    // Build prompt for FB post
    const prompt = this.buildFbPostPrompt(item, customInstructions);

    try {
      const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
      
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `Bạn là chuyên gia viết bài bán hàng trên Facebook cho shop xe mô hình/diecast. 

Quy tắc quan trọng:
- Tone: Casual, thân thiện, hấp dẫn nhưng không quá marketing
- PHẢI sử dụng emoji phù hợp 🔥 🚗 💎 ⭐ 💰 📦 🏎️
- PHẢI thêm hashtags phổ biến ở cuối bài (#diecast #mohinh #xemohinh #collector)
- KHÔNG bịa thông tin không có trong dữ liệu
- Nếu field nào null/empty, KHÔNG đề cập đến field đó
- Bài viết nên ngắn gọn (100-150 từ), dễ đọc
- Viết bằng tiếng Việt

Cấu trúc bài viết:
1. Tiêu đề hấp dẫn với emoji
2. Mô tả ngắn gọn sản phẩm
3. Thông tin: giá, tình trạng, tỷ lệ (nếu có)
4. Call-to-action (inbox, comment để đặt hàng)
5. Hashtags`
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
      });

      return this.parseFacebookPostResponse(completion.choices[0]?.message?.content);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      console.error('OpenAI API error:', error);
      throw this.mapProviderError(error, 'Failed to generate Facebook post');
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

  private buildFbPostPrompt(item: Item, customInstructions?: string): string {
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
    if (item.status) {
      const statusText = item.status === 'con_hang' ? 'Còn hàng' : item.status === 'giu_cho' ? 'Giữ chỗ' : 'Đã bán';
      itemData.push(`Trạng thái: ${statusText}`);
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

    let prompt = `Viết bài bán hàng Facebook cho sản phẩm xe mô hình sau:\n\n${itemData.join('\n')}`;
    
    if (customInstructions) {
      prompt += `\n\nYêu cầu bổ sung từ người dùng: ${customInstructions}`;
    }

    return prompt;
  }


  async analyzeImages(imageBuffers: Buffer[]): Promise<import('../items/dto/ai-draft.dto').AiAnalysisResult> {
    this.ensureApiKeyConfigured();

    const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';

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
            - Brand (Hãng sản xuất mô hình, ví dụ: Hot Wheels, MiniGT, Tarmac Works, Tomica, ...)
            - Car Brand (Hãng xe thật, ví dụ: Nissan, Lamborghini, Ferrari, ...)
            - Model Brand (Dòng xe, ví dụ: GT-R R35, Aventador, ...)
            - Scale (Tỷ lệ, ví dụ: 1:64, 1:43, 1:18, ...). Nếu không chắc chắn, hãy đoán dựa trên kích thước phổ biến (thường là 1:64 nếu là Hot Wheels/MiniGT).
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
      console.error('OpenAI Vision Error:', error);
      throw this.mapProviderError(error, 'Failed to analyze images');
    }
  }

  private ensureApiKeyConfigured() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'OpenAI API key not configured');
    }
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

  private parseFacebookPostResponse(content: string | null | undefined): { content: string } {
    if (!content || !content.trim()) {
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, 'AI did not return content');
    }

    return { content: content.trim() };
  }

  private parseImageAnalysisResponse(content: string | null | undefined): import('../items/dto/ai-draft.dto').AiAnalysisResult {
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
      aiJson: parsed.aiJson as import('../items/dto/ai-draft.dto').AiAnalysisResult['aiJson'],
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
