import { IsOptional, IsInt, Min, IsString, IsBoolean, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ItemStatus } from '../../generated/prisma/client';

export class QueryItemsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page_size?: number = 20;

  @IsOptional()
  @IsIn(['con_hang', 'giu_cho', 'da_ban'])
  status?: ItemStatus;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_public?: boolean;

  @IsOptional()
  @IsString()
  q?: string;
}

