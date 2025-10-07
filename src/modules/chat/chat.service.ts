import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import {
  Conversation,
  ConversationDocument,
} from './schemas/conversation.schema';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Find or create a conversation between two users
   */
  async findOrCreateConversation(
    userAId: string,
    userBId: string,
  ): Promise<ConversationDocument> {
    const userA = new Types.ObjectId(userAId);
    const userB = new Types.ObjectId(userBId);

    let conversation = await this.conversationModel.findOne({
      participants: { $all: [userA, userB] },
    });

    if (!conversation) {
      const unreadCounts: Record<string, number> = {
        [userAId]: 0,
        [userBId]: 0,
      };

      conversation = new this.conversationModel({
        participants: [userA, userB],
        unreadCounts,
      });

      await conversation.save();
    }

    return conversation;
  }

  /**
   * Send a message between users, update conversation & publish event
   */
  async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
    conversationId?: string,
  ) {
    // 1️⃣ Find or create conversation
    const conversation = conversationId
      ? await this.conversationModel.findById(conversationId)
      : await this.findOrCreateConversation(senderId, receiverId);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // 2️⃣ Create message
    const message = await this.messageModel.create({
      sender: new Types.ObjectId(senderId),
      receiver: new Types.ObjectId(receiverId),
      conversation: conversation._id,
      content,
    });

    await message.populate([
      { path: 'sender', select: 'fullName profilePic' },
      { path: 'receiver', select: 'fullName profilePic' },
    ]);

    // 3️⃣ Update conversation info
    conversation.lastMessage = message._id;

    const unreadCounts =
      conversation.unreadCounts instanceof Map
        ? Object.fromEntries(conversation.unreadCounts.entries())
        : conversation.unreadCounts || {};

    unreadCounts[receiverId] = (unreadCounts[receiverId] || 0) + 1;

    conversation.unreadCounts = unreadCounts;
    await conversation.save();

    // 4️⃣ Publish to Redis
    const payload = {
      conversationId: conversation._id.toString(),
      receiverId,
      message: message.toObject(),
    };

    await this.redisService.publish('chat:message', JSON.stringify(payload));

    return {
      success: true,
      message,
      conversationId: conversation._id.toString(),
    };
  }

  /**
   * Get all conversations of a user
   */
  async getConversations(userId: string) {
    return this.conversationModel
      .find({ participants: userId })
      .populate({
        path: 'lastMessage',
        populate: [
          { path: 'sender', select: 'fullName profilePic' },
          { path: 'receiver', select: 'fullName profilePic' },
        ],
      })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(conversationId: string, limit = 50, before?: Date) {
    const filter: Record<string, any> = { conversation: conversationId };
    if (before) filter.createdAt = { $lt: before };

    const messages = await this.messageModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'fullName profilePic')
      .populate('receiver', 'fullName profilePic')
      .lean()
      .exec();

    return messages.reverse();
  }
}
