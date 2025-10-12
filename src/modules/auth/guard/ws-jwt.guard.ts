// src/auth/guard/ws-jwt.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();

    const token =
      client.handshake?.auth?.token ||
      client.handshake?.query?.token ||
      client.handshake?.headers?.authorization;

    if (!token) throw new UnauthorizedException('Missing token');

    try {
      const raw = token.replace(/^Bearer\s+/i, '');
      const payload = this.jwtService.verify(raw, {
        secret: process.env.SECRET_KEY,
      });

      // Gắn payload vào socket để Gateway sử dụng
      client.data.user = {
        id: payload.id,
        email: payload.email,
      };

      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
