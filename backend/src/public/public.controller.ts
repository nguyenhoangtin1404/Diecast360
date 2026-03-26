import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { PublicService } from './public.service';
import { QueryPublicItemsDto } from './dto/query-public-items.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('items')
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Query() queryDto: QueryPublicItemsDto, @Req() req: Request) {
    const user = req.user as { active_shop_id?: string | null } | undefined;
    const tenantId = user?.active_shop_id ?? null;
    return this.publicService.findAll(queryDto, tenantId);
  }

  @Get('items/:id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { active_shop_id?: string | null } | undefined;
    const tenantId = user?.active_shop_id ?? null;
    return this.publicService.findOne(id, tenantId);
  }
}

