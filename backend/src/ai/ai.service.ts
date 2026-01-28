import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../common/prisma/prisma.service';
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

  async generateItemDescription(itemId: string, customInstructions?: string): Promise<AiDescriptionResponseDto> {
    // Check if API key is configured
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'OpenAI API key not configured');
    }

    // Fetch item data
    const item = await this.prisma.item.findFirst({
      where: {
        id: itemId,
        deleted_at: null,
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

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, 'AI did not return content');
      }

      const parsed = JSON.parse(content) as AiDescriptionResponseDto;
      
      // Validate response structure
      if (!parsed.short_description || !parsed.long_description || !parsed.bullet_specs || !parsed.meta_title || !parsed.meta_description) {
        throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, 'AI returned incomplete content');
      }

      return parsed;
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      console.error('OpenAI API error:', error);
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, 'Failed to generate AI description');
    }
  }

  private buildPrompt(item: any, customInstructions?: string): string {
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
      const priceNum = typeof item.price.toNumber === 'function' ? item.price.toNumber() : Number(item.price);
      itemData.push(`Giá: ${priceNum.toLocaleString('vi-VN')} VND`);
    }
    if (item.original_price != null) {
      const originalPriceNum = typeof item.original_price.toNumber === 'function' ? item.original_price.toNumber() : Number(item.original_price);
      itemData.push(`Giá gốc: ${originalPriceNum.toLocaleString('vi-VN')} VND`);
    }
    if (item.description) itemData.push(`Mô tả hiện tại: ${item.description}`);

    let prompt = `Tạo nội dung SEO cho sản phẩm diecast sau:\n\n${itemData.join('\n')}`;
    
    if (customInstructions) {
      prompt += `\n\nYêu cầu bổ sung từ người dùng: ${customInstructions}`;
    }

    return prompt;
  }
}
