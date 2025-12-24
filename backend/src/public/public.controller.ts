import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicService } from './public.service';
import { QueryPublicItemsDto } from './dto/query-public-items.dto';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('items')
  findAll(@Query() queryDto: QueryPublicItemsDto) {
    return this.publicService.findAll(queryDto);
  }

  @Get('items/:id')
  findOne(@Param('id') id: string) {
    return this.publicService.findOne(id);
  }
}

