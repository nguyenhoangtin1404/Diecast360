import { IsOptional, IsString, IsIn, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryCategoriesDto {
  @IsOptional()
  @IsString()
  @IsIn(['car_brand', 'model_brand'])
  type?: string;

  /** UUID or shop slug — merges global seed categories with this shop's categories */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  shop_id?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  is_active?: boolean;
}
