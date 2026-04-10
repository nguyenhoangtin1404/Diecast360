import { IsEnum } from 'class-validator';
import { PreOrderStatus } from '../../generated/prisma/client';

export class TransitionPreorderStatusDto {
  @IsEnum(PreOrderStatus)
  status: PreOrderStatus;
}
