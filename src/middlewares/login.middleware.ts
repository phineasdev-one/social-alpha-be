import { validation } from '@/constant/validation';
import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoginMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;

    if (!email) {
      throw new HttpException('EMAIL_IS_REQUIRED', HttpStatus.BAD_REQUEST);
    }

    if (!password) {
      throw new HttpException('PASSWORD_IS_REQUIRED', HttpStatus.BAD_REQUEST);
    }

    if (typeof password !== 'string') {
      throw new HttpException(
        'PASSWORD_MUST_BE_STRING',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (password.length < validation.PASSWORD_MIN_LENGTH) {
      throw new HttpException(
        `PASSWORD_MUST_BE_AT_LEAST_${validation.PASSWORD_MIN_LENGTH}_CHARACTERS`,
        HttpStatus.BAD_REQUEST,
      );
    }

    next();
  }
}
