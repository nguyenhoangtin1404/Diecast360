import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateSpinSetDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

