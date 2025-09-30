import { Get, Post, Param, Req, Controller } from '@nestjs/common';
import { FriendRequestService } from './friend-request.service';
import { PrivateRoute } from '../auth/auth.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@PrivateRoute()
@ApiBearerAuth()
@ApiTags('friend-requests')
@Controller('v1/friend-requests')
export class FriendRequestController {
  constructor(private readonly friendRequestsService: FriendRequestService) {}

  @Get('recommended')
  @ApiOperation({ summary: 'Get recommended users (not friends yet)' })
  @ApiResponse({ status: 200, description: 'List of recommended users' })
  async getRecommendedUsers(@Req() req) {
    const userId = req.user.id;
    return this.friendRequestsService.getRecommendedUsers(userId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my friends list' })
  @ApiResponse({ status: 200, description: 'List of friends' })
  async getMyFriends(@Req() req) {
    const userId = req.user.id;
    return this.friendRequestsService.getMyFriends(userId);
  }

  @Post('send/:id')
  @ApiOperation({ summary: 'Send a friend request' })
  @ApiResponse({ status: 201, description: 'Friend request created' })
  async sendFriendRequest(@Req() req, @Param('id') recipientId: string) {
    const userId = req.user.id;
    return this.friendRequestsService.sendFriendRequest(userId, recipientId);
  }

  @Post('accept/:id')
  @ApiOperation({ summary: 'Accept a friend request' })
  @ApiResponse({ status: 200, description: 'Friend request accepted' })
  async acceptFriendRequest(@Req() req, @Param('id') requestId: string) {
    const userId = req.user.id;
    return this.friendRequestsService.acceptFriendRequest(userId, requestId);
  }

  @Get('incoming')
  @ApiOperation({ summary: 'Get incoming friend requests' })
  @ApiResponse({ status: 200, description: 'List of incoming requests' })
  async getFriendRequests(@Req() req) {
    const userId = req.user.id;
    return this.friendRequestsService.getFriendRequests(userId);
  }

  @Get('outgoing')
  @ApiOperation({ summary: 'Get outgoing (sent) friend requests' })
  @ApiResponse({ status: 200, description: 'List of outgoing requests' })
  async getOutgoingFriendReqs(@Req() req) {
    const userId = req.user.id;
    return this.friendRequestsService.getOutgoingFriendReqs(userId);
  }
}
