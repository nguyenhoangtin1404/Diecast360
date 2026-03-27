import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ShopAuditAction } from '../../generated/prisma/client';

export class QueryShopAuditLogsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([10, 20, 50, 100])
  @Max(100)
  page_size?: number = 20;

  @IsOptional()
  @IsIn(Object.values(ShopAuditAction))
  action?: ShopAuditAction;
}
