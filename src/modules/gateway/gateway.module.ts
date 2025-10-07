import { Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { RedisModule } from '../redis/redis.module';
import { RedisService } from '../redis/redis.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    RedisModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [RealtimeGateway, RedisService],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
