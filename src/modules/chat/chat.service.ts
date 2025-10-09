import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { Conversation } from './schemas/conversation.schema';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,

    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,

    private readonly redisService: RedisService,
  ) {}

  async sendMessage(senderId: string, receiverId: string, content: string) {
    let conversation = await this.conversationModel.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = new this.conversationModel({
        participants: [senderId, receiverId],
        unreadCounts: { [senderId]: 0, [receiverId]: 0 },
      });
      await conversation.save();
    }

    const message = await this.messageModel.create({
      sender: senderId,
      receiver: receiverId,
      conversation: conversation._id,
      content,
    });

    // Cache vào Redis
    const redisClient = this.redisService.getClient();
    const convKey = `chat:conv:${conversation._id}:messages`;
    await redisClient.lPush(convKey, JSON.stringify(message));
    await redisClient.lTrim(convKey, 0, 49); // giữ tối đa 50 tin
    await redisClient.expire(convKey, 600); // 10 phút TTL

    // Update unread cache
    await redisClient.hIncrBy(
      `chat:user:${receiverId}:unread`,
      conversation._id.toString(),
      1,
    );

    // Publish event để gateway gửi socket real-time
    await this.redisService.publish(
      'channel:message:new',
      JSON.stringify({
        conversationId: conversation._id,
        senderId,
        receiverId,
        content,
        createdAt: message.createdAt,
      }),
    );

    // Update Mongo lastMessage
    await this.conversationModel.findByIdAndUpdate(conversation._id, {
      lastMessage: message._id,
    });

    return message;
  }

  async getMessages(conversationId: string) {
    return this.messageModel
      .find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', '_id name')
      .populate('receiver', '_id name');
  }

  async getUserConversations(userId: string) {
    return this.conversationModel
      .find({ participants: userId })
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
  }

  /**
   * Đánh dấu đã đọc tin nhắn
   */
  async markAsRead(conversationId: string, userId: string) {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) throw new NotFoundException('Conversation not found');

    await this.messageModel.updateMany(
      { conversation: conversationId, receiver: userId, isRead: false },
      { $set: { isRead: true } },
    );

    conversation.unreadCounts[userId] = 0;
    await conversation.save();

    return { success: true };
  }
}
