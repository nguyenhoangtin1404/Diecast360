import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength, ValidateIf } from 'class-validator';

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
}

