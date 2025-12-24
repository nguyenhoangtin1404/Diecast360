import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class CreateItemDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  scale?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsIn(['con_hang', 'giu_cho', 'da_ban'])
  status?: string;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}

