import { Server as SocketIOServer } from 'socket.io';
import { SimpleChatGateway } from './SimpleChatGateway';

let chatGateway: SimpleChatGateway | null = null;

export const initializeSockets = (io: SocketIOServer) => {
  chatGateway = new SimpleChatGateway(io);
  return chatGateway;
};

export const getChatGateway = () => {
  if (!chatGateway) {
    throw new Error('Socket gateway not initialized');
  }
  return chatGateway;
};
