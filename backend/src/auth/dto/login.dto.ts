import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(1)
  password: string;

  /** Cloudflare Turnstile or Google reCAPTCHA response token when CAPTCHA_ENABLED=true */
  @IsOptional()
  @IsString()
  captcha_token?: string;
}
