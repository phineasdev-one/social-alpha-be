import { IsNotEmpty, IsString } from 'class-validator';

export class OnboardDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  bio: string;

  @IsString()
  @IsNotEmpty()
  nativeLanguage: string;

  @IsString()
  @IsNotEmpty()
  learningLanguage: string;

  @IsString()
  @IsNotEmpty()
  location: string;
}
