import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateAiDescriptionDto } from './dto/ai-description.dto';

@Controller('api/v1/items')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post(':id/ai-description')
  async generateDescription(
    @Param('id') id: string,
    @Body() dto: GenerateAiDescriptionDto,
  ) {
    const result = await this.aiService.generateItemDescription(id, dto.custom_instructions);
    return {
      ok: true,
      data: result,
    };
  }
}
