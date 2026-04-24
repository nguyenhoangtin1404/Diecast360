import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateMembershipTierDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  rank?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  min_points?: number;
}
