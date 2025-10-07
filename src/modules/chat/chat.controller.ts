import { Controller, Post, Body, Get, Param, Query, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dtos/create-message.dto';
import { PrivateRoute } from '../auth/auth.decorator'; // bác đã có

@PrivateRoute()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // send message (via HTTP)
  @Post('message')
  async sendMessage(@Req() req, @Body() dto: CreateMessageDto) {
    const senderId = req.user?.id || req.user?._id || req.user?.sub;
    const message = await this.chatService.sendMessage(
      senderId,
      dto.receiverId,
      dto.content,
      dto.conversationId,
    );
    return { success: true, message };
  }

  // list conversations for logged user
  @Get('conversations')
  async getConversations(@Req() req) {
    const userId = req.user?.id || req.user?._id || req.user?.sub;
    const conv = await this.chatService.getConversations(userId);
    return { success: true, conversations: conv };
  }

  // get messages in a conversation
  @Get('conversation/:id/messages')
  async getMessages(
    @Param('id') conversationId: string,
    @Query('limit') limit = '50',
    @Query('before') before?: string,
  ) {
    const lim = parseInt(limit, 10) || 50;
    const beforeDate = before ? new Date(before) : undefined;
    const messages = await this.chatService.getMessages(
      conversationId,
      lim,
      beforeDate,
    );
    return { success: true, messages };
  }
}
