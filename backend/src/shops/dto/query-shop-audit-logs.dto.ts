import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class QueryShopAuditLogsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([10, 20, 50, 100])
  @Max(100)
  page_size?: number = 20;

  @IsOptional()
  @IsIn([
    'add_shop_admin',
    'reset_member_password',
    'set_member_active',
    'update_shop',
    'deactivate_shop',
    'activate_shop',
  ])
  action?:
    | 'add_shop_admin'
    | 'reset_member_password'
    | 'set_member_active'
    | 'update_shop'
    | 'deactivate_shop'
    | 'activate_shop';
}
