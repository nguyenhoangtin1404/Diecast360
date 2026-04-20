import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateAiDescriptionDto, GenerateFbPostDto } from './dto/ai-description.dto';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';

@Controller('items')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post(':id/ai-description')
  @Throttle({ default: { ttl: 60000, limit: 25 } })
  async generateDescription(
    @Param('id') id: string,
    @Body() dto: GenerateAiDescriptionDto,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.aiService.generateItemDescription(id, tenantId, dto.custom_instructions);
  }

  @Post(':id/fb-post')
  @Throttle({ default: { ttl: 60000, limit: 25 } })
  async generateFbPost(
    @Param('id') id: string,
    @Body() dto: GenerateFbPostDto,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.aiService.generateFacebookPost(id, tenantId, dto.custom_instructions);
  }
}
