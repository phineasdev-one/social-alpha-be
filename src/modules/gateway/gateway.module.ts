import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { RedisModule } from '../redis/redis.module';
import { RedisService } from '../redis/redis.service';
import { AuthModule } from '../auth/auth.module';
import { ChatModule } from '../chat/chat.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [RedisModule, AuthModule, ChatModule, UsersModule],
  providers: [RealtimeGateway, RedisService],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
