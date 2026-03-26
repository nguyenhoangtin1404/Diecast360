import { IsBoolean } from 'class-validator';

export class SetShopMemberActiveDto {
  @IsBoolean()
  is_active: boolean;
}
