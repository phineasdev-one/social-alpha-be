import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { MarkAsReadDto, SendMessageDto } from './dtos/chat.dto';
import { PrivateRoute } from '../auth/auth.decorator';

@ApiTags('Chat')
@PrivateRoute()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('send')
  @ApiOperation({ summary: 'Gửi tin nhắn giữa hai người dùng' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({
    status: 201,
    description: 'Tin nhắn đã được gửi và lưu vào DB',
  })
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(
      dto.senderId,
      dto.receiverId,
      dto.content,
    );
  }

  @Get(':conversationId/messages')
  @ApiOperation({ summary: 'Lấy danh sách tin nhắn trong 1 cuộc hội thoại' })
  async getMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.getMessages(conversationId);
  }

  @Get('conversations/:userId')
  @ApiOperation({ summary: 'Lấy tất cả cuộc hội thoại của 1 user' })
  async getConversations(@Param('userId') userId: string) {
    return this.chatService.getUserConversations(userId);
  }

  @Post(':conversationId/read')
  @ApiOperation({ summary: 'Đánh dấu tin nhắn trong cuộc hội thoại đã đọc' })
  @ApiBody({ type: MarkAsReadDto })
  async markAsRead(
    @Param('conversationId') conversationId: string,
    @Body() dto: MarkAsReadDto,
  ) {
    return this.chatService.markAsRead(conversationId, dto.userId);
  }
}
