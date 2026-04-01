import { IsString, IsOptional, IsBoolean, IsIn, IsNumber, Min, IsEnum, IsNotEmpty, IsInt, ValidateIf } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ItemStatus } from '../../generated/prisma/client';
import { IsItemAttributes, type ItemAttributesInput } from './item-attributes.validator';

export class UpdateItemDto {
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  scale?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  brand?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  car_brand?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
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

  @ValidateIf((_, value) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity?: number;

  @ValidateIf((_, value) => value !== undefined)
  @IsItemAttributes()
  attributes?: ItemAttributesInput;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  fb_post_content?: string;
}

