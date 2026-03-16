import { IsOptional, IsString, MaxLength } from 'class-validator';

// Facebook Graph API limit for page post content is ~63,206 characters.
// We cap at 63,000 to give a safe margin.
const FACEBOOK_MAX_POST_LENGTH = 63_000;

export class PublishFacebookPostDto {
  @IsOptional()
  @IsString()
  @MaxLength(FACEBOOK_MAX_POST_LENGTH, {
    message: `Nội dung quá dài cho Facebook post (tối đa ${FACEBOOK_MAX_POST_LENGTH} ký tự)`,
  })
  content?: string;
}
