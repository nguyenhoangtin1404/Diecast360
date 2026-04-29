import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength, ValidateIf } from 'class-validator';
import { ShopRole } from '../../generated/prisma/client';

export class AddShopAdminDto {
  /**
   * Add by user id.
   * Provide either `user_id` OR `email`.
   */
  @ValidateIf((o) => !o.email)
  @IsUUID()
  user_id?: string;

  /**
   * Add by user email.
   * Provide either `email` OR `user_id`.
   */
  @ValidateIf((o) => !o.user_id)
  @IsEmail()
  email?: string;

  /**
   * Optional password.
   * - If the user already exists: ignored.
   * - If the user does not exist: required to create the account.
   */
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  /**
   * Optional full name (for newly created users).
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  full_name?: string;

  /**
   * Role to assign to the member in this shop.
   * Defaults to shop_admin if not provided.
   * Platform-level roles (platform_super) cannot be set via this endpoint.
   */
  @IsOptional()
  @IsEnum([ShopRole.shop_admin, ShopRole.shop_staff])
  role?: ShopRole.shop_admin | ShopRole.shop_staff;
}
