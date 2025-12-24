import { IsOptional, IsInt, Min } from 'class-validator';

export class UploadFrameDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  frame_index?: number;
}

