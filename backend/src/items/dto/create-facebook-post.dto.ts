import { IsString, IsOptional, IsUrl, Matches } from 'class-validator';

export class CreateFacebookPostDto {
  @IsUrl({}, { message: 'post_url phải là URL hợp lệ' })
  @Matches(/facebook\.com|fb\.com/, { message: 'post_url phải là link Facebook' })
  post_url: string;

  @IsOptional()
  @IsString()
  content?: string;
}
