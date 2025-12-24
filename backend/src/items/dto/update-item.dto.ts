import { IsString, IsOptional, IsBoolean, IsIn, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  scale?: string;

  @IsOptional()
  @IsString()
  brand?: string;

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
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsIn(['con_hang', 'giu_cho', 'da_ban'])
  status?: string;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}

