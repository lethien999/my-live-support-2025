import { Server as SocketIOServer } from 'socket.io';
import { ChatGateway } from './chatGateway';

let chatGateway: ChatGateway | null = null;

export const initializeSockets = (io: SocketIOServer) => {
  chatGateway = new ChatGateway(io);
  return chatGateway;
};

export const getChatGateway = () => {
  if (!chatGateway) {
    throw new Error('Socket gateway not initialized');
  }
  return chatGateway;
};
