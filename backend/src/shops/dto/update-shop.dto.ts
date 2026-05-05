import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ShopContactPhoneDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  tel?: string;

  @IsOptional()
  @IsString()
  hint?: string;
}

class ShopContactFacebookDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  url?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  hint?: string;
}

class ShopContactZaloDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  url?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  hint?: string;
}

class ShopContactHoursDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  schedule_line?: string;

  @IsOptional()
  @IsString()
  footer_note?: string;
}

/** Nested contact sections for PATCH /admin/shops/:id — replaces corresponding slice when provided */
export class ShopContactPatchDto {
  @IsOptional()
  @IsString()
  page_title?: string;

  @IsOptional()
  @IsString()
  page_subtitle?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShopContactPhoneDto)
  phone?: ShopContactPhoneDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShopContactFacebookDto)
  facebook?: ShopContactFacebookDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShopContactZaloDto)
  zalo?: ShopContactZaloDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShopContactHoursDto)
  hours?: ShopContactHoursDto;
}

export class UpdateShopDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShopContactPatchDto)
  contact?: ShopContactPatchDto;
}
