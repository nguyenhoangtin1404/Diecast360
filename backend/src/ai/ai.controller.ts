import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateAiDescriptionDto, GenerateFbPostDto } from './dto/ai-description.dto';

@Controller('items')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post(':id/ai-description')
  async generateDescription(
    @Param('id') id: string,
    @Body() dto: GenerateAiDescriptionDto,
  ) {
    return this.aiService.generateItemDescription(id, dto.custom_instructions);
  }

  @Post(':id/fb-post')
  async generateFbPost(
    @Param('id') id: string,
    @Body() dto: GenerateFbPostDto,
  ) {
    return this.aiService.generateFacebookPost(id, dto.custom_instructions);
  }
}
