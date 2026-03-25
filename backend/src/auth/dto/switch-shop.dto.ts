import { IsNotEmpty, IsUUID } from 'class-validator';

export class SwitchShopDto {
  @IsUUID()
  @IsNotEmpty()
  shop_id: string;
}
