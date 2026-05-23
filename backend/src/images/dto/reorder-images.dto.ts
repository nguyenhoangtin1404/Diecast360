import { IsArray, IsUUID } from 'class-validator';

export class ReorderImagesDto {
  @IsArray()
  @IsUUID('all', { each: true })
  image_ids: string[];
}

