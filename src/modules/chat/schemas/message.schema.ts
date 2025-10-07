import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message &
  Document & {
    _id: Types.ObjectId;
  };

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiver: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversation: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ default: 'text' })
  type: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversation: 1, createdAt: -1 });
