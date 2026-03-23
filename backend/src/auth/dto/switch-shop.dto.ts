import { IsString, IsNotEmpty } from 'class-validator';

export class SwitchShopDto {
  @IsString()
  @IsNotEmpty()
  shop_id: string;
}
