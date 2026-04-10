import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePreorderDto {
  @IsUUID()
  item_id: string;

  @IsOptional()
  @IsUUID()
  user_id?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unit_price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  deposit_amount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  paid_amount?: number;

  @IsOptional()
  @IsDateString()
  expected_arrival_at?: string;

  @IsOptional()
  @IsDateString()
  expected_delivery_at?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  note?: string;
}
