export type TGenericResponse<T = unknown, M = unknown> = {
  success: boolean;
  code: number;
  message: string;
  data?: T;
  token?: string;
  meta?: M;
};

export type TGenericError = {
  success: false;
  code: number;
  message: string;
};

export type TGenericOK<T = unknown, M = unknown> = {
  success: true;
  code: number;
  message: string;
  data?: T;
  meta?: M;
};
