import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, minlength: 6 })
  password: string;

  @Prop({ default: '' })
  bio: string;

  @Prop({ default: '' })
  profilePic: string;

  @Prop({ default: '' })
  nativeLanguage: string;

  @Prop({ default: '' })
  learningLanguage: string;

  @Prop({ default: '' })
  location: string;

  @Prop({ default: false })
  isOnboarded: boolean;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  friends: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
