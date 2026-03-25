import { IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateShopDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  /**
   * Optional URL slug. When omitted, the service derives a unique slug from `name`.
   */
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase letters, digits, and single hyphens only',
  })
  slug?: string;
}
