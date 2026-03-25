import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SwitchShopDto {
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  shop_id: string;
}
