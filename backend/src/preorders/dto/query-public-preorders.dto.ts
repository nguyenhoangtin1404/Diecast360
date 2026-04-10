import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { PreOrderStatus } from '../../generated/prisma/client';

export class QueryPublicPreordersDto {
  @IsUUID()
  shop_id: string;

  @IsOptional()
  @IsEnum(PreOrderStatus)
  status?: PreOrderStatus;

  @IsOptional()
  @IsUUID()
  item_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page_size?: number;
}
