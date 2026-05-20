import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateAiDescriptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'custom_instructions must be at most 2000 characters' })
  custom_instructions?: string;
}

export class AiDescriptionResponseDto {
  short_description: string;
  long_description: string;
  bullet_specs: string[];
  meta_title: string;
  meta_description: string;
}

export class GenerateFbPostDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'custom_instructions must be at most 2000 characters' })
  custom_instructions?: string;
}

export class FbPostResponseDto {
  content: string;
}
