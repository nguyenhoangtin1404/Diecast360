import { IsIn } from 'class-validator';

export class ShopBrandingUploadDto {
  @IsIn(['logo', 'favicon'])
  kind!: 'logo' | 'favicon';
}
