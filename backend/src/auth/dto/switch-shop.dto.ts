import { IsUUID } from 'class-validator';

export class SwitchShopDto {
  @IsUUID()
  shop_id: string;
}
