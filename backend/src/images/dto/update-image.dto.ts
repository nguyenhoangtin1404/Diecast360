import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateImageDto {
  @IsOptional()
  @IsBoolean()
  is_cover?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  display_order?: number;
}

