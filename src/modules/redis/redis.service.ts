import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private subscriber: RedisClientType;

  async onModuleInit() {
    const url = process.env.REDIS_URI;
    this.client = createClient({ url });
    this.client.on('error', err => console.error('Redis client error', err));
    await this.client.connect();

    this.subscriber = this.client.duplicate();
    this.subscriber.on('error', err =>
      console.error('Redis subscriber error', err),
    );
    await this.subscriber.connect();
  }

  async onModuleDestroy() {
    if (this.client) await this.client.disconnect().catch(() => {});
    if (this.subscriber) await this.subscriber.disconnect().catch(() => {});
  }

  getClient(): RedisClientType {
    return this.client;
  }

  // Publish message to channel
  async publish(channel: string, message: string) {
    await this.client.publish(channel, message);
  }

  // Subscribe to channel with callback (message -> handler)
  async subscribe(channel: string, handler: (msg: string) => void) {
    // Note: redis v4 subscribe returns Promise which resolves once subscription exists
    await this.subscriber.subscribe(channel, message => {
      try {
        handler(message);
      } catch (err) {
        console.error('redis subscribe handler error', err);
      }
    });
  }

  // Helper: set/get socket mapping
  async setSocket(userId: string, socketId: string) {
    await this.client.set(`socket:${userId}`, socketId);
  }
  async getSocket(userId: string): Promise<string | null> {
    const socketId = await this.client.get(`socket:${userId}`);
    return (socketId as string) ?? null;
  }
  async delSocket(userId: string) {
    await this.client.del(`socket:${userId}`);
  }
}
