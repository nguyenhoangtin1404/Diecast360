import { IsOptional, IsString } from 'class-validator';

export class GenerateAiDescriptionDto {
  @IsOptional()
  @IsString()
  custom_instructions?: string;
}

export class AiDescriptionResponseDto {
  short_description: string;
  long_description: string;
  bullet_specs: string[];
  meta_title: string;
  meta_description: string;
}
