import { IsArray, IsUUID } from 'class-validator';

export class ReorderFramesDto {
  @IsArray()
  @IsUUID('all', { each: true })
  frame_ids: string[];
}

