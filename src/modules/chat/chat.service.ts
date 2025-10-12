import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';
import { Conversation } from './schemas/conversation.schema';
import { SendMessageDto } from './dtos/chat.dto';
import { InjectHttpException } from '@/common/decorators/try-catch.decorator';
import { ChatMessage } from '@/constant/message';
import { NotFoundEx } from '@/exceptions/common.exception';
import CommonHelper from '@/common/helper/common.helper';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,

    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,
  ) {}

  @InjectHttpException('Invalid', 400)
  async sendMessage(senderId: string, payload: SendMessageDto) {
    const { content, receiverId, type } = payload;
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
      type: type || 'text',
    });

    await this.conversationModel.findByIdAndUpdate(conversation._id, {
      lastMessage: message._id,
    });

    return message;
  }

  @InjectHttpException('Invalid', 400)
  async getMessages(conversationId: string) {
    return this.messageModel
      .find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', '_id name')
      .populate('receiver', '_id name');
  }

  @InjectHttpException('Invalid', 400)
  async getUserConversations(userId: string) {
    return this.conversationModel
      .find({ participants: userId })
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
  }

  @InjectHttpException('Invalid', 400)
  async markAsRead(conversationId: string, userId: string) {
    const conversation = await this.conversationModel.findById(conversationId);

    if (!conversation) throw new NotFoundEx(ChatMessage.conversationNotFound);

    await this.messageModel.updateMany(
      { conversation: conversationId, receiver: userId, isRead: false },
      { $set: { isRead: true } },
    );

    conversation.unreadCounts[userId] = 0;
    await conversation.save();

    return CommonHelper.sendOKResponse({});
  }
}
