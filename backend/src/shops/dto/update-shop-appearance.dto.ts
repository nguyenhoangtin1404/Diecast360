import { IsOptional, IsString, IsUrl, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ShopContactPatchDto } from './update-shop.dto';

/** Branding / storefront — stored in Shop.appearance_json; public UI can read later */
export class ShopAppearancePatchDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  logo_url?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && String(v).trim().length > 0)
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  favicon_url?: string;

  @IsOptional()
  @IsString()
  primary_color?: string;

  @IsOptional()
  @IsString()
  accent_color?: string;

  @IsOptional()
  @IsString()
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
