import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AiDraftItemDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model_name?: string;

  @IsOptional()
  @IsString()
  scale?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  product_code?: string;
  
  @IsOptional()
  @IsString()
  car_brand?: string;
  
  @IsOptional()
  @IsString()
  model_brand?: string;
}

export class AiAnalysisResult {
  @ValidateNested()
  @Type(() => AiDraftItemDto)
  aiJson: AiDraftItemDto;

  @IsOptional()
  confidence?: Record<string, number>;
  
  @IsOptional()
  extracted_text?: string;
}
