import { IsOptional, IsString, IsUrl, Matches, MaxLength, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ShopContactPatchDto } from './update-shop.dto';

/** Safe subset for values that may later be applied to inline CSS */
const CSS_TOKEN_COLOR = /^#[0-9A-Fa-f]{3,8}$|^[a-zA-Z][a-zA-Z0-9\-]*$/;
const CSS_FONT_FAMILY = /^[a-zA-Z0-9\s\-'",.]+$/;

/** Branding / storefront — stored in Shop.appearance_json; public UI can read later */
export class ShopAppearancePatchDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(2000)
  logo_url?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  @MaxLength(2000)
  favicon_url?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsString()
  @MaxLength(64)
  @Matches(CSS_TOKEN_COLOR, {
    message: 'primary_color must be a hex color (#RGB) or a simple CSS color keyword',
  })
  primary_color?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsString()
  @MaxLength(64)
  @Matches(CSS_TOKEN_COLOR, {
    message: 'accent_color must be a hex color (#RGB) or a simple CSS color keyword',
  })
  accent_color?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsString()
  @MaxLength(200)
  @Matches(CSS_FONT_FAMILY, { message: 'font_family contains invalid characters' })
  font_family?: string;
}

export class UpdateShopSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ShopContactPatchDto)
  contact?: ShopContactPatchDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShopAppearancePatchDto)
  appearance?: ShopAppearancePatchDto;
}
