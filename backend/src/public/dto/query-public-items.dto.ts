import { IsOptional, IsInt, Min, IsString, IsIn, Max, MaxLength } from 'class-validator';
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
  @Max(100)
  page_size?: number = 20;

  @IsOptional()
  @IsIn(['con_hang', 'giu_cho', 'da_ban'])
  status?: 'con_hang' | 'giu_cho' | 'da_ban';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  car_brand?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  model_brand?: string;

  @IsOptional()
  @IsIn(['new', 'old'])
  condition?: 'new' | 'old';

  @IsOptional()
  @IsIn(['name', 'price', 'created_at'])
  sort_by?: 'name' | 'price' | 'created_at' = 'created_at';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort_order?: 'asc' | 'desc' = 'desc';
}

