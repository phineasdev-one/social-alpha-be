import CommonHelper from '@/common/helper/common.helper';
import { HttpException, HttpStatus } from '@nestjs/common';

export class CommonException extends HttpException {
  constructor(message: string, status: HttpStatus) {
    super(
      CommonHelper.sendGenericError({
        message,
        code: status,
      }),
      status,
    );
  }
}

export class BadRequestEx extends CommonException {
  constructor(message = 'Bad request') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class UnauthorizedEx extends CommonException {
  constructor(message = 'Unauthorized') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class ConflictEx extends CommonException {
  constructor(message = 'Conflict') {
    super(message, HttpStatus.CONFLICT);
  }
}

export class NotFoundEx extends CommonException {
  constructor(message = 'Not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}
