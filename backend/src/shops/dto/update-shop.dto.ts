import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ShopContactPhoneDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsString()
  @MaxLength(80)
  title?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsString()
  @MaxLength(120)
  label?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsString()
  @MaxLength(25)
  @Matches(/^[+\d\s\-().]{6,25}$/, { message: 'tel must look like a phone number' })
  tel?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsString()
  @MaxLength(200)
  hint?: string;
}

class ShopContactFacebookDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsString()
  @MaxLength(80)
  title?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(2000)
  url?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsString()
  @MaxLength(200)
  label?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsString()
  @MaxLength(200)
  hint?: string;
}

class ShopContactZaloDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsString()
  @MaxLength(80)
  title?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(2000)
  url?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsString()
  @MaxLength(200)
  label?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsString()
  @MaxLength(200)
  hint?: string;
}

class ShopContactHoursDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsString()
  @MaxLength(2000)
  schedule_line?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsString()
  @MaxLength(500)
  footer_note?: string;
}

/** Nested contact sections for PATCH /admin/shops/:id — replaces corresponding slice when provided */
export class ShopContactPatchDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsString()
  @MaxLength(200)
  page_title?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsString()
  @MaxLength(500)
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

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsString()
  @MaxLength(1000)
  address?: string;
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
