import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { RedisModule } from '../redis/redis.module';
import { RedisService } from '../redis/redis.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [RedisModule, AuthModule],
  providers: [RealtimeGateway, RedisService],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
