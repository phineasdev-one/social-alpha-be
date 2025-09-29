import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dtos/register.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}
  async login(user: User) {
    const payload = {
      email: user.email,
    };
    return {
      user: {
        email: user.email,
        fullName: user.fullName,
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async validateUser(email: string, IncomingPassword: string) {
    const customer = await this.userService.findByEmail(email);

    if (!customer) {
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    }

    const isValidPassword = await bcrypt.compare(
      IncomingPassword,
      customer.password,
    );

    if (!isValidPassword) {
      throw new HttpException('Invalid password', HttpStatus.BAD_REQUEST);
    }

    delete customer.password;
    return customer;
  }

  async createUser(createUserDto: RegisterDto) {
    const idx = Math.floor(Math.random() * 100) + 1; // generate a num between 1-100
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;
    const hash = await bcrypt.hash(createUserDto.password, 10);

    const createdUser = new this.userModel({
      password: hash,
      profilePic: randomAvatar,
      email: createUserDto.email,
      fullName: createUserDto.fullName,
    });

    return createdUser.save();
  }

  async getProfile(email: string) {
    return this.userModel.findOne({ email }).select('-password');
  }
}
