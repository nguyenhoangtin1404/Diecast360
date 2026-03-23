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
import { PublishFacebookPostDto } from './dto/publish-facebook-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';

@Controller('items')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ItemsController {
  private readonly logger = new Logger(ItemsController.name);

  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  create(
    @Body() createItemDto: CreateItemDto,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.itemsService.create(createItemDto, tenantId);
  }

  @Get()
  findAll(
    @Query() queryDto: QueryItemsDto,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.itemsService.findAll(queryDto, tenantId);
  }

  @Get('search')
  search(
    @Query('q') q: string,
    @CurrentTenantId() tenantId: string,
  ) {
    if (!q) {
      return this.itemsService.findAll({}, tenantId);
    }
    return this.itemsService.search(q, tenantId);
  }

  @Get('export')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="items.csv"')
  async exportCsv(
    @Res() res: Response,
    @CurrentTenantId() tenantId: string,
  ) {
    try {
      const csv = await this.itemsService.exportCsv(tenantId);
      res.send(csv);
    } catch (error) {
      this.logger.error('CSV Export failed', (error as Error).stack);
      res.status(500).json({ ok: false, message: 'Export failed' });
    }
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.itemsService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateItemDto: UpdateItemDto,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.itemsService.update(id, updateItemDto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id') id: string,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.itemsService.remove(id, tenantId);
  }

  // NOTE: This route must appear BEFORE `@Post(':id/facebook-posts')` below.
  // NestJS resolves routes in declaration order — "/publish" is a literal segment
  // and would be ambiguous against a future ":postId" dynamic segment if ordering
  // were reversed. Keep these two routes adjacent and in this order.
  @Post(':id/facebook-posts/publish')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  publishFacebookPost(
    @Param('id') id: string,
    @Body() dto: PublishFacebookPostDto,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.itemsService.publishFacebookPost(id, dto, tenantId);
  }

  @Post(':id/facebook-posts')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  addFacebookPost(
    @Param('id') id: string,
    @Body() dto: CreateFacebookPostDto,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.itemsService.addFacebookPost(id, dto, tenantId);
  }

  @Delete(':id/facebook-posts/:postId')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  removeFacebookPost(
    @Param('id') id: string,
    @Param('postId') postId: string,
    @CurrentTenantId() tenantId: string,
  ) {
    return this.itemsService.removeFacebookPost(id, postId, tenantId);
  }
}
