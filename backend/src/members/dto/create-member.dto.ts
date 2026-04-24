import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMemberDto {
  @IsString()
  @MaxLength(120)
  full_name!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(190)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
