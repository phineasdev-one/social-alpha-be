import { HttpStatus } from '@nestjs/common';
import {
  TGenericError,
  TGenericOK,
  TGenericResponse,
} from '../types/generic-response';

export default class CommonHelper {
  static sendGenericResponse<T = unknown, M = unknown>({
    success,
    data,
    message,
    token,
    code = HttpStatus.OK,
    meta,
  }: TGenericResponse<T, M>): TGenericResponse<T, M> {
    return {
      success,
      code,
      message,
      data,
      token,
      meta,
    };
  }

  static sendGenericError({
    message,
    code = HttpStatus.BAD_REQUEST,
  }: Partial<TGenericError>): TGenericError {
    return {
      success: false,
      code,
      message: message ?? 'An error occurred',
    };
  }

  static sendOKResponse({ message = 'OK' }: Partial<TGenericOK>): TGenericOK {
    return {
      success: true,
      code: HttpStatus.OK,
      message,
    };
  }
}
