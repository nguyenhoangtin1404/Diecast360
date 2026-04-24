import { IsInt, IsString, MaxLength, Min } from 'class-validator';

export class CreateMembershipTierDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsInt()
  @Min(1)
  rank!: number;

  @IsInt()
  @Min(0)
  min_points!: number;
}
