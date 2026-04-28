import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { MemberPointsMutationType } from '../../generated/prisma/client';

/**
 * Validates `points` according to mutation type:
 *  - earn / redeem : must be a positive integer (>= 1)
 *  - adjust        : must be a non-zero integer (allows negatives)
 *
 * Using a custom constraint because two mutually-exclusive @ValidateIf
 * decorators on the same property are AND-ed by class-validator, making
 * both conditions simultaneously impossible to satisfy.
 */
@ValidatorConstraint({ name: 'isValidAdjustPoints', async: false })
class IsValidAdjustPointsConstraint implements ValidatorConstraintInterface {
  validate(points: number, args: ValidationArguments): boolean {
    const dto = args.object as { type: MemberPointsMutationType };
    if (!Number.isInteger(points)) return false;
    return dto.type === MemberPointsMutationType.adjust ? points !== 0 : points >= 1;
  }

  defaultMessage(args: ValidationArguments): string {
    const dto = args.object as { type?: MemberPointsMutationType };
    return dto.type === MemberPointsMutationType.adjust
      ? 'points must be a non-zero integer for adjust type'
      : 'points must be a positive integer for earn/redeem type';
  }
}

function IsValidAdjustPoints(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsValidAdjustPointsConstraint,
    });
  };
}

export class AdjustMemberPointsDto {
  @IsEnum(MemberPointsMutationType)
  type!: MemberPointsMutationType;

  @IsValidAdjustPoints()
  points!: number;

  @IsString()
  @MaxLength(240)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
