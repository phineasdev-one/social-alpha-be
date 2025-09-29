import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

import * as dotenv from 'dotenv';

dotenv.config();

type ValidatePayload = {
  email: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
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
    return {
      email: payload.email,
    };
  }
}
