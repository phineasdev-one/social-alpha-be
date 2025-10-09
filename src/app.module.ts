import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { FriendRequestModule } from './modules/friend-request/friend-request.module';
import { RealtimeModule } from './modules/gateway/gateway.module';
import { RedisModule } from './modules/redis/redis.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    DatabaseModule,
    FriendRequestModule,
    RealtimeModule,
    RedisModule,
    MongooseModule.forRoot(process.env.MONGO_URI),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
