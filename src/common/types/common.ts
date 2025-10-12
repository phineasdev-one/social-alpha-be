import { Socket } from 'socket.io';

export type ValidatePayload = {
  email: string;
  id: string;
};

export type SocketWithAuth = ValidatePayload & Socket;
