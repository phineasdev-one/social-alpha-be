// src/realtime/realtime.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UseFilters, UseGuards } from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
import { SendMessageDto } from '../chat/dtos/chat.dto';
import { WsCatchAllFilter } from '@/exceptions/ws-catch-all-filter';
import { UsersService } from '../users/users.service';
import { WsJwtGuard } from '../auth/guard/ws-jwt.guard';
@UseGuards(WsJwtGuard)
@UseFilters(new WsCatchAllFilter())
@WebSocketGateway({
  cors: { origin: '*' },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly userService: UsersService,
  ) {}

  afterInit(server: Server) {
    console.log('[Gateway initialized]');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake?.auth?.token as string) ||
        (client.handshake?.query?.token as string);

      if (!token) {
        console.log('Cannot connect');
        client.emit('error', 'No token provided');
        client.disconnect();
        return;
      }

      const raw = token.replace(/^Bearer\s+/i, '');
      const payload = this.jwtService.verify(raw, {
        secret: process.env.SECRET_KEY,
      });

      const user = await this.userService.findByEmail(payload.email);

      const userId = user._id.toString();

      if (!userId) {
        client.emit('error', 'Invalid token payload');
        client.disconnect();
        return;
      }

      client.data.userId = userId;
      client.data.email = user.email;

      client.join(userId);
      console.log(`Socket connected: user=${userId}, socket=${client.id}`);
    } catch (err) {
      console.error('Socket auth error:', err?.message || err);
      client.emit('error', 'Authentication failed');
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      console.log(`Socket disconnected: user=${userId}, socket=${client.id}`);
    }
  }

  // ============================================================
  // 🗣 Event: join room (conversation)
  // ============================================================
  @SubscribeMessage('join_room')
  async onJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { conversationId } = data;
    if (!conversationId) return;

    client.join(`conv_${conversationId}`);
    console.log(`👥 User ${client.data.userId} joined conv_${conversationId}`);

    client.emit('joined_room', { conversationId });
  }

  // ============================================================
  // Event: send message
  // ============================================================
  @SubscribeMessage('send_message')
  async onSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageDto,
  ) {
    const senderId = client.data.userId;
    if (!senderId) {
      client.emit('error', 'Unauthorized');
      return;
    }

    const message = await this.chatService.sendMessage(senderId, payload);

    const room = `conv_${message.conversation._id}`;
    this.server.to(room).emit('receive_message', message);

    this.server.to(payload.receiverId).emit('receive_message', message);

    console.log(
      `Message sent: [conv=${message.conversation._id}] from=${senderId}`,
    );

    return { status: 'ok', message };
  }
}
