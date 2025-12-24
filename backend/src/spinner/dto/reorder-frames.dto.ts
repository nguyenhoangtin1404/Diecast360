import { IsArray, IsUUID } from 'class-validator';

export class ReorderFramesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  frame_ids: string[];
}

