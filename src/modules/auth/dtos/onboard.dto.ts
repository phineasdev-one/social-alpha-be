import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class OnboardDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bio: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nativeLanguage: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  learningLanguage: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty()
  @IsString()
  profilePic: string;
}
