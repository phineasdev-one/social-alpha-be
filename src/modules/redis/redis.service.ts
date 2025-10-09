import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private subscriber: RedisClientType;
  private ready = false;

  async onModuleInit() {
    const url = process.env.REDIS_URI || 'redis://localhost:6379';

    // Tạo client chính
    this.client = createClient({ url });
    this.client.on('error', err => console.error('Redis client error', err));
    await this.client.connect();

    // Tạo subscriber
    this.subscriber = this.client.duplicate();
    this.subscriber.on('error', err =>
      console.error('Redis subscriber error', err),
    );
    await this.subscriber.connect();

    this.ready = true;
    console.log('✅ RedisService initialized');
  }

  async onModuleDestroy() {
    if (this.client) await this.client.disconnect().catch(() => {});
    if (this.subscriber) await this.subscriber.disconnect().catch(() => {});
    console.log('🛑 RedisService destroyed');
  }

  private async ensureReady() {
    if (!this.ready) {
      throw new Error('Redis not initialized yet');
    }
  }

  /** Lấy client chính */
  getClient(): RedisClientType {
    return this.client;
  }

  /** Publish message đến channel */
  async publish(channel: string, message: string) {
    await this.ensureReady();
    await this.client.publish(channel, message);
  }

  /** Subscribe đến channel với handler */
  async subscribe(channel: string, handler: (msg: string) => void) {
    await this.ensureReady();
    await this.subscriber.subscribe(channel, (message: string) => {
      try {
        handler(message);
      } catch (err) {
        console.error('Redis subscribe handler error', err);
      }
    });
  }

  /** Lưu mapping userId -> socketId */
  async setSocket(userId: string, socketId: string) {
    await this.ensureReady();
    await this.client.set(`socket:${userId}`, socketId);
  }

  /** Lấy socketId theo userId */
  async getSocket(userId: string): Promise<string | null> {
    await this.ensureReady();
    const socketId = await this.client.get(`socket:${userId}`);
    return (socketId as string) ?? null;
  }

  /** Xóa socketId theo userId */
  async delSocket(userId: string) {
    await this.ensureReady();
    await this.client.del(`socket:${userId}`);
  }
}
