import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  full_name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(190)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;
}
