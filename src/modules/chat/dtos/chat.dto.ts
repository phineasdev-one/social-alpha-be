import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    example: '652a9c07f1d12345abcd6799',
    description: 'Receiver ID',
  })
  @IsMongoId()
  receiverId: string;

  @ApiProperty({ example: 'Hello Susan', description: 'Content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: 'text',
    description: 'Type of message',
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;
}

export class MarkAsReadDto {
  @ApiProperty({
    example: '652a9c07f1d12345abcd6789',
    description: 'Reader',
  })
  @IsMongoId()
  userId: string;
}
