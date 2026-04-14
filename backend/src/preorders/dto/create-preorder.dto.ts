import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
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

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ValidateIf((_, v) => v !== undefined && v !== null && v !== '')
  @IsString()
  @MaxLength(2048)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
  cover_image_url?: string;
}
