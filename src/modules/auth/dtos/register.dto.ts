import { validation } from '@/constant/validation';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsString()
  @MinLength(validation.PASSWORD_MIN_LENGTH)
  @IsNotEmpty()
  @Type(() => String)
  password: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  @Type(() => String)
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  fullName: string;
}
