import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dtos/register.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OnboardDto } from './dtos/onboard.dto';
import CommonHelper from '@/common/helper/common.helper';
import { AuthMessage } from '@/constant/message';
import { ConflictEx, NotFoundEx } from '@/exceptions/common.exception';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}
  async login(user: UserDocument) {
    const payload = {
      email: user.email,
      id: user.id,
    };
    return CommonHelper.sendGenericResponse({
      data: {
        user: {
          email: user.email,
          fullName: user.fullName,
          isOnboarded: user.isOnboarded,
          id: user._id.toString(),
        },
      },
      token: this.jwtService.sign(payload),
      code: HttpStatus.OK,
      message: 'Ok',
      success: true,
    });
  }

  async validateUser(email: string, IncomingPassword: string) {
    const customer = await this.userService.findByEmail(email);

    if (!customer) {
      throw new HttpException(AuthMessage.userNotFound, HttpStatus.BAD_REQUEST);
    }

    const isValidPassword = await bcrypt.compare(
      IncomingPassword,
      customer.password,
    );

    if (!isValidPassword) {
      throw new HttpException(
        CommonHelper.sendGenericError({
          message: AuthMessage.invalidPassword,
        }),
        HttpStatus.BAD_REQUEST,
      );
    }

    delete customer.password;
    return customer;
  }

  async createUser(createUserDto: RegisterDto) {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });

    if (existingUser) {
      throw new ConflictEx(AuthMessage.useAlreadyExisted);
    }

    const hash = await bcrypt.hash(createUserDto.password, 10);

    // Random avatar
    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    const createdUser = new this.userModel({
      email: createUserDto.email,
      password: hash,
      fullName: createUserDto.fullName,
      profilePic: randomAvatar,
    });

    return createdUser.save();
  }

  async getProfile(userId: string) {
    const query = this.userModel.findById(userId).select('-password');
    const userProfile = await query.lean<User>();

    if (!userProfile) {
      throw new NotFoundException('User not found');
    }

    return CommonHelper.sendOKResponse({
      data: userProfile,
    });
  }

  async onboardUser(userId: string, onboardDto: OnboardDto) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      {
        ...onboardDto,
        isOnboarded: true,
      },
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundEx(AuthMessage.userNotFound);
    }

    return CommonHelper.sendOKResponse({
      data: updatedUser,
    });
  }
}
