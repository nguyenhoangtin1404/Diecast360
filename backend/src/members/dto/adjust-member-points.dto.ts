import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  NotEquals,
  ValidateIf,
} from 'class-validator';
import { MemberPointsMutationType } from '../../generated/prisma/client';

export class AdjustMemberPointsDto {
  @IsEnum(MemberPointsMutationType)
  type!: MemberPointsMutationType;

  @ValidateIf((dto: AdjustMemberPointsDto) => dto.type !== MemberPointsMutationType.adjust)
  @IsInt()
  @Min(1)
  @ValidateIf((dto: AdjustMemberPointsDto) => dto.type === MemberPointsMutationType.adjust)
  @IsInt()
  @NotEquals(0)
  points!: number;

  @IsString()
  @MaxLength(240)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
