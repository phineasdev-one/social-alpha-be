import { Socket } from 'socket.io';
import { Request } from 'express';
import { UserDocument } from '@/modules/users/schemas/user.schema';

export type ValidatePayload = {
  email: string;
  id: string;
};

export type SocketWithAuth = ValidatePayload & Socket;

export interface AuthenticatedRequest extends Request {
  user: UserDocument;
}
