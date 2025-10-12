import { HttpException, HttpStatus } from '@nestjs/common';
import CommonHelper from '../helper/common.helper';

const isAsyncFunction = (func: any): func is Function => {
  return (
    func.constructor.name === 'AsyncFunction' && typeof func === 'function'
  );
};

// Method decorator
export const InjectHttpException = (
  message: string,
  code: HttpStatus = undefined,
) => {
  return (_, ___, descriptor: PropertyDescriptor) => {
    const errorCode = code || HttpStatus.INTERNAL_SERVER_ERROR;
    const { value } = descriptor;

    if (isAsyncFunction(value)) {
      descriptor.value = async function (...args: any[]) {
        try {
          return await value.apply(this, args);
        } catch (error) {
          if (process.env.NODE_ENV === 'development')
            console.error('\n', error, '\n');
          if (error instanceof HttpException) throw error;

          return CommonHelper.sendGenericError({
            success: false,
            code: errorCode,
            message: message,
          });
        }
      };
      return descriptor;
    }

    descriptor.value = function (...args: any[]) {
      try {
        return value.apply(this, args);
      } catch (error) {
        if (process.env.NODE_ENV === 'development')
          console.error('\n', error, '\n');
        if (error instanceof HttpException) throw error;
        return CommonHelper.sendGenericError({
          success: false,
          code: errorCode,
          message: message,
        });
      }
    };
    return descriptor;
  };
};
