import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Model, Types } from 'mongoose';
import {
  FriendRequest,
  FriendRequestDocument,
} from './schemas/friend-request.schema';

@Injectable()
export class FriendRequestService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(FriendRequest.name)
    private friendRequestModel: Model<FriendRequestDocument>,
  ) {}

  async getRecommendedUsers(currentUserId: string) {
    const currentUser = await this.userModel.findById(currentUserId);

    return this.userModel.find({
      $and: [
        { _id: { $ne: currentUserId } },
        { _id: { $nin: currentUser.friends } },
        { isOnboarded: true },
      ],
    });
  }

  async getMyFriends(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('friends')
      .populate(
        'friends',
        'fullName profilePic nativeLanguage learningLanguage',
      );
    return user?.friends ?? [];
  }

  async sendFriendRequest(myId: string, recipientId: string) {
    if (myId === recipientId) {
      throw new BadRequestException(
        "You can't send friend request to yourself",
      );
    }

    const recipient = await this.userModel.findById(recipientId);
    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    if (recipient.friends.includes(new Types.ObjectId(myId))) {
      throw new BadRequestException('You are already friends with this user');
    }

    const existingRequest = await this.friendRequestModel.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      throw new BadRequestException('A friend request already exists');
    }

    return this.friendRequestModel.create({
      sender: myId,
      recipient: recipientId,
    });
  }

  async acceptFriendRequest(requestId: string, userId: string) {
    const friendRequest = await this.friendRequestModel.findById(requestId);

    if (!friendRequest) {
      throw new NotFoundException('Friend request not found');
    }

    if (friendRequest.recipient.toString() !== userId) {
      throw new ForbiddenException(
        'You are not authorized to accept this request',
      );
    }

    friendRequest.status = 'accepted';
    await friendRequest.save();

    await this.userModel.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await this.userModel.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    return { message: 'Friend request accepted' };
  }

  async getFriendRequests(userId: string) {
    const incomingReqs = await this.friendRequestModel
      .find({
        recipient: userId,
        status: 'pending',
      })
      .populate(
        'sender',
        'fullName profilePic nativeLanguage learningLanguage',
      );

    const acceptedReqs = await this.friendRequestModel
      .find({
        sender: userId,
        status: 'accepted',
      })
      .populate('recipient', 'fullName profilePic');

    return { incomingReqs, acceptedReqs };
  }

  async getOutgoingFriendReqs(userId: string) {
    return this.friendRequestModel
      .find({
        sender: userId,
        status: 'pending',
      })
      .populate(
        'recipient',
        'fullName profilePic nativeLanguage learningLanguage',
      );
  }
}
