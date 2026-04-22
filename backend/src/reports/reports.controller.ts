import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ShopRole } from '../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';
import { ReportsService } from './reports.service';
import { QueryReportSummaryDto } from './dto/query-report-summary.dto';
import { QueryReportTrendsDto } from './dto/query-report-trends.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles(ShopRole.shop_admin, ShopRole.super_admin)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  getSummary(@CurrentTenantId() tenantId: string, @Query() query: QueryReportSummaryDto) {
    return this.reportsService.getSummary(tenantId, query.range);
  }

  @Get('trends')
  getTrends(@CurrentTenantId() tenantId: string, @Query() query: QueryReportTrendsDto) {
    return this.reportsService.getTrends(tenantId, query.range, query.bucket);
  }
}
