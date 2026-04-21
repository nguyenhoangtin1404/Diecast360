import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { InventoryTransactionType } from '../../generated/prisma/client';

export class CreateInventoryTransactionDto {
  @IsEnum(InventoryTransactionType)
  type: InventoryTransactionType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @MaxLength(255)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  adjustment_delta?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  allow_negative_stock?: boolean;
}
