import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReverseInventoryTransactionDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
