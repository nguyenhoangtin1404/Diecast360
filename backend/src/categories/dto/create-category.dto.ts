import { IsString, IsOptional, IsIn, IsNotEmpty, MaxLength, IsInt, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @MaxLength(100, { message: 'Tên danh mục không quá 100 ký tự' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name: string;

  @IsString()
  @IsIn(['car_brand', 'model_brand'])
  type: string;

  @IsOptional()
  @IsInt({ message: 'Thứ tự hiển thị phải là số nguyên' })
  @Min(0, { message: 'Thứ tự hiển thị phải >= 0' })
  @Type(() => Number)
  display_order?: number;
}
