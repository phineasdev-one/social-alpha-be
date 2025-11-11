import {
  Request,
  Controller,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
  Get,
  Put,
  Patch,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';

import { LocalAuthGuard } from './guard/local-auth.guard';
import { LoginDto, LoginResponseDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { PrivateRoute } from './auth.decorator';
import { OnboardDto } from './dtos/onboard.dto';
import { TGenericOK, TGenericResponse } from '@/common/types/generic-response';
import { User, UserDocument } from '../users/schemas/user.schema';
import { AuthUser } from '@/common/decorators/auth-user.decorator';

@ApiTags('v1/auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OK',
    type: LoginResponseDto,
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request',
  })
  async login(@Request() req): Promise<TGenericResponse<LoginResponseDto>> {
    return this.authService.login(req.user);
  }

  @Post('/register')
  @ApiOperation({ summary: 'User register a new account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The account has been successfully created',
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request',
  })
  async register(@Body() payload: RegisterDto) {
    return this.authService.createUser(payload);
  }

  @Get('/me')
  @PrivateRoute()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return current logged in user profile',
  })
  async getMyProfile(
    @AuthUser() user: UserDocument,
  ): Promise<TGenericOK<Partial<User>>> {
    console.log('first', user);
    return this.authService.getProfile(user.id);
  }

  @Patch('/onboarding')
  @ApiBearerAuth()
  @PrivateRoute()
  @ApiBody({ type: OnboardDto })
  @ApiOperation({ summary: 'Update user info during onboarding' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully onboarded',
  })
  async onboard(
    @AuthUser() authUser: UserDocument,
    @Body() onboardDto: OnboardDto,
  ) {
    const userId = authUser.id;
    const user = await this.authService.onboardUser(userId, onboardDto);
    return user;
  }
}
