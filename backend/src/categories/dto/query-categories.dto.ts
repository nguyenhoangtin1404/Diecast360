import { IsOptional, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryCategoriesDto {
  @IsOptional()
  @IsString()
  @IsIn(['car_brand', 'model_brand'])
  type?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  is_active?: boolean;
}
