import { IsString, IsOptional, IsBoolean, IsIn, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ItemStatus } from '../../generated/prisma/client';

export class CreateItemDto {
  @IsString()
  name: string;

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
  condition?: 'new' | 'old';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  original_price?: number;

  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @IsOptional()
  @IsString()
  draft_id?: string;
}

