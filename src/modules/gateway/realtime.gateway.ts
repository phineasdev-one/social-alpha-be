import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  async afterInit() {
    await this.redisService.subscribe(
      'chat:message',
      async (payloadStr: string) => {
        try {
          const payload = JSON.parse(payloadStr);
          const { receiverId, conversationId, message } = payload;

          const socketId = await this.redisService.getSocket(receiverId);
          if (socketId) {
            this.server
              .to(socketId)
              .emit('receive_message', { conversationId, message });
          }

          if (conversationId) {
            this.server
              .to(conversationId)
              .emit('conversation_message', { conversationId, message });
          }
        } catch (err) {
          console.error('Failed to handle chat:message payload', err);
        }
      },
    );
  }

  async handleConnection(client: Socket) {
    try {
      // Expect JWT token in handshake.auth.token or handshake.query.token
      const token =
        (client.handshake?.auth && client.handshake.auth.token) ||
        client.handshake?.query?.token;

      if (!token) {
        client.emit('error', 'No token provided');
        client.disconnect();
        return;
      }

      // remove Bearer if present
      const raw = token.toString().replace(/^Bearer\s+/i, '');
      const payload = this.jwtService.verify(raw, {
        secret: process.env.JWT_SECRET,
      });

      // Support payload.sub or payload.userId or payload.id
      const userId = (payload &&
        (payload.sub || payload.userId || payload.id)) as string;
      if (!userId) {
        client.emit('error', 'Invalid token payload');
        client.disconnect();
        return;
      }

      client.data.userId = userId;

      // store mapping in Redis so any instance can find socketId
      await this.redisService.setSocket(userId, client.id);

      // optionally join user to personal room by id
      client.join(userId);

      console.log(`Socket connected: user=${userId} socket=${client.id}`);
    } catch (err) {
      console.log('Socket auth error', err?.message || err);
      client.emit('error', 'Authentication failed');
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const uid = client.data?.userId;
    if (uid) {
      await this.redisService.delSocket(uid);
      client.leave(uid);
      console.log(`Socket disconnected: user=${uid} socket=${client.id}`);
    }
  }
}
