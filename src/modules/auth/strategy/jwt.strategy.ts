import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import * as dotenv from 'dotenv';
import { AuthService } from '../auth.service';
import { UsersService } from '@/modules/users/users.service';

dotenv.config();

type ValidatePayload = {
  email: string;
  id: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UsersService) {
    console.log('first', process.env.SECRET_KEY);

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.NODE_ENV === 'test'
          ? `${process.env.SECRET_KEY}`
          : `${process.env.SECRET_KEY}`,
    });
  }

  async validate(payload: ValidatePayload): Promise<ValidatePayload> {
    const user = await this.userService.findByEmail(payload.email);

    if (!user) {
      throw new HttpException(
        'CUSTOMER_DO_NOT_HAVE_PERMISSION_TO_ACCESS_THIS_RESOURCE',
        HttpStatus.FORBIDDEN,
      );
    }

    return {
      email: payload.email,
      id: user._id.toString(),
    };
  }
}
