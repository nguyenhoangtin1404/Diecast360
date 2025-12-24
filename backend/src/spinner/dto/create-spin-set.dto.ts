import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateSpinSetDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

