import { IsArray, IsUUID } from 'class-validator';

export class ReorderImagesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  image_ids: string[];
}

