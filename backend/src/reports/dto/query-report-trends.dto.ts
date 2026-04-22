import { IsIn, IsOptional } from 'class-validator';
import { REPORT_RANGE_VALUES, type ReportRange } from './query-report-summary.dto';

export const REPORT_BUCKET_VALUES = ['day', 'week'] as const;
export type ReportBucket = (typeof REPORT_BUCKET_VALUES)[number];

export class QueryReportTrendsDto {
  @IsOptional()
  @IsIn(REPORT_RANGE_VALUES)
  range?: ReportRange;

  @IsOptional()
  @IsIn(REPORT_BUCKET_VALUES)
  bucket?: ReportBucket;
}
