import { IsOptional, IsInt, Min, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPublicItemsDto {
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
  status?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  car_brand?: string;

  @IsOptional()
  @IsString()
  model_brand?: string;

  @IsOptional()
  @IsIn(['new', 'old'])
  condition?: string;

  @IsOptional()
  @IsIn(['name', 'price', 'created_at'])
  sort_by?: string = 'created_at';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort_order?: string = 'desc';
}

