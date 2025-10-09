import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;

  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  /** Khởi tạo gateway: subscribe Redis channel */
  async afterInit() {
    try {
      await this.redisService.subscribe('chat:message', async payloadStr => {
        try {
          const payload = JSON.parse(payloadStr);
          const { receiverId, conversationId, message } = payload;

          // Gửi đến socket của user nếu đang online
          const socketId = await this.redisService.getSocket(receiverId);
          if (socketId) {
            this.server
              .to(socketId)
              .emit('receive_message', { conversationId, message });
          }

          // Gửi đến tất cả user join room conversation
          if (conversationId) {
            this.server
              .to(conversationId)
              .emit('conversation_message', { conversationId, message });
          }
        } catch (err) {
          console.error('Failed to handle chat:message payload', err);
        }
      });
      console.log('✅ RealtimeGateway initialized and subscribed to Redis');
    } catch (err) {
      console.error('❌ Failed to subscribe Redis channel', err);
    }
  }

  /** Khi client connect */
  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake?.auth?.token as string) ||
        (client.handshake?.query?.token as string);

      if (!token) {
        client.emit('error', 'No token provided');
        client.disconnect();
        return;
      }

      const raw = token.replace(/^Bearer\s+/i, '');
      const payload = this.jwtService.verify(raw, {
        secret: process.env.JWT_SECRET,
      });

      const userId = payload?.sub || payload?.userId || payload?.id;
      if (!userId) {
        client.emit('error', 'Invalid token payload');
        client.disconnect();
        return;
      }

      client.data.userId = userId;

      // Lưu socketId vào Redis
      await this.redisService.setSocket(userId, client.id);

      // Join personal room
      client.join(userId);

      console.log(`Socket connected: user=${userId}, socket=${client.id}`);
    } catch (err) {
      console.log('Socket auth error', err?.message || err);
      client.emit('error', 'Authentication failed');
      client.disconnect();
    }
  }

  /** Khi client disconnect */
  async handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      await this.redisService.delSocket(userId);
      client.leave(userId);
      console.log(`Socket disconnected: user=${userId}, socket=${client.id}`);
    }
  }

  /** Helper: publish message vào Redis */
  async publishMessage(
    receiverId: string,
    conversationId: string,
    message: any,
  ) {
    await this.redisService.publish(
      'chat:message',
      JSON.stringify({ receiverId, conversationId, message }),
    );
  }
}
