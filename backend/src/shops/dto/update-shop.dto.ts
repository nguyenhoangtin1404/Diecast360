import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateShopDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
