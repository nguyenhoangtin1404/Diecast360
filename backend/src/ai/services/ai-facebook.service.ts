import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Item } from '../../generated/prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { toNumber } from '../../common/utils/decimal.utils';
import { AppException, ErrorCode } from '../../common/exceptions/http-exception.filter';
import { clampCustomInstructions, mapProviderError } from '../ai-utils';

@Injectable()
export class AiFacebookService {
  private readonly logger = new Logger(AiFacebookService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject('OPENAI_CLIENT') private openai: OpenAI,
  ) {}

  async generateFacebookPost(
    itemId: string,
    tenantId: string,
    customInstructions?: string,
  ): Promise<{ content: string }> {
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

    const prompt = this.buildFbPostPrompt(item, clampCustomInstructions(customInstructions));

    try {
      const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
      this.logger.log(`ai.openai_call op=fb_post shop_id=${tenantId} item_id=${itemId} model=${model}`);
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
      this.logger.error('OpenAI API error', error instanceof Error ? error.stack : String(error));
      throw mapProviderError(error, 'Failed to generate Facebook post');
    }
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
      const statusText = item.status === 'con_hang' ? 'Còn hàng' : item.status === 'giu_cho' ? 'Giữ chỗ' : item.status === 'preorder' ? 'Pre-order' : 'Đã bán';
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

  private parseFacebookPostResponse(content: string | null | undefined): { content: string } {
    if (!content || !content.trim()) {
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, 'AI did not return content');
    }

    return { content: content.trim() };
  }

}
