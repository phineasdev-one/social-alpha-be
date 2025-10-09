import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    example: '652a9c07f1d12345abcd6789',
    description: 'Người gửi',
  })
  @IsMongoId()
  senderId: string;

  @ApiProperty({
    example: '652a9c07f1d12345abcd6799',
    description: 'Người nhận',
  })
  @IsMongoId()
  receiverId: string;

  @ApiProperty({ example: 'Hello Vy 💬', description: 'Nội dung tin nhắn' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: 'text',
    description: 'Loại tin nhắn',
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: string;
}

export class MarkAsReadDto {
  @ApiProperty({
    example: '652a9c07f1d12345abcd6789',
    description: 'Người đọc',
  })
  @IsMongoId()
  userId: string;
}
