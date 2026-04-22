import { IsIn, IsOptional } from 'class-validator';

export const REPORT_RANGE_VALUES = ['7d', '30d', '90d'] as const;
export type ReportRange = (typeof REPORT_RANGE_VALUES)[number];

export class QueryReportSummaryDto {
  @IsOptional()
  @IsIn(REPORT_RANGE_VALUES)
  range?: ReportRange;
}
