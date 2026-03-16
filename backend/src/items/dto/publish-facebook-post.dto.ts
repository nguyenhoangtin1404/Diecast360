import { IsOptional, IsString } from 'class-validator';

export class PublishFacebookPostDto {
  @IsOptional()
  @IsString()
  content?: string;
}
