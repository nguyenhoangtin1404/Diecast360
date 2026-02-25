import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { QueryItemsDto } from './dto/query-items.dto';
import { CreateFacebookPostDto } from './dto/create-facebook-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('items')
@UseGuards(JwtAuthGuard)
export class ItemsController {
  private readonly logger = new Logger(ItemsController.name);

  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  create(@Body() createItemDto: CreateItemDto) {
    return this.itemsService.create(createItemDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryItemsDto) {
    return this.itemsService.findAll(queryDto);
  }

  @Get('search')
  search(@Query('q') q: string) {
    if (!q) {
      return this.itemsService.findAll({});
    }
    return this.itemsService.search(q);
  }

  @Get('export')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="items.csv"')
  async exportCsv(@Res() res: Response) {
    try {
      const csv = await this.itemsService.exportCsv();
      res.send(csv);
    } catch (error) {
      this.logger.error('CSV Export failed', (error as Error).stack);
      res.status(500).json({ ok: false, message: 'Export failed' });
    }
  }


  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateItemDto: UpdateItemDto) {
    return this.itemsService.update(id, updateItemDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }

  @Post(':id/facebook-posts')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  addFacebookPost(
    @Param('id') id: string,
    @Body() dto: CreateFacebookPostDto,
  ) {
    return this.itemsService.addFacebookPost(id, dto);
  }

  @Delete(':id/facebook-posts/:postId')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  removeFacebookPost(
    @Param('id') id: string,
    @Param('postId') postId: string,
  ) {
    return this.itemsService.removeFacebookPost(id, postId);
  }
}
