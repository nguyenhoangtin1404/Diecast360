import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  IsNumber,
  Min,
  IsEnum,
  IsNotEmpty,
  IsInt,
  ValidateIf,
  MaxLength,
  IsISO8601,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ItemStatus } from '../../generated/prisma/client';
import { IsItemAttributes, type ItemAttributesInput } from './item-attributes.validator';
import { MAX_CATEGORY_BRAND_NAME_LENGTH } from '../../common/utils/category-brand.utils';

export class CreateItemDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  name: string;

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
  @MaxLength(MAX_CATEGORY_BRAND_NAME_LENGTH)
  car_brand?: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_CATEGORY_BRAND_NAME_LENGTH)
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
  draft_id?: string;

  @IsOptional()
  @IsISO8601()
  preorder_closes_at?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  preorder_price?: number;
}


