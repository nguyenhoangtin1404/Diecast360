import { IsString, MinLength } from 'class-validator';

export class ResetShopMemberPasswordDto {
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  password: string;
}
