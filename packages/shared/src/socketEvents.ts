// Socket.IO event constants
export const SOCKET_EVENTS = {
  // Chat events
  CHAT_JOIN: 'chat:join',
  CHAT_LEAVE: 'chat:leave',
  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVE: 'message:receive',
  TYPING: 'typing',
  
  // Ticket events
  TICKET_UPDATED: 'ticket:updated',
  QUEUE_UPDATED: 'queue:updated',
  
  // System events
  ERROR: 'error',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
} as const;

export type SocketEvent = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS];

// Socket event payload types
export interface ChatJoinPayload {
  roomId: string;
}

export interface ChatLeavePayload {
  roomId: string;
}

export interface MessageSendPayload {
  roomId: string;
  type: 'text' | 'file' | 'system';
  content: string;
  fileId?: string;
}

export interface MessageReceivePayload {
  id: string;
  roomId: string;
  senderId: string;
  type: 'text' | 'file' | 'system';
  content: string;
  fileId?: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    role: string;
  };
  file?: {
    id: string;
    filename: string;
    mime: string;
    size: number;
    url: string;
  };
}

export interface TypingPayload {
  roomId: string;
  isTyping: boolean;
}

export interface TypingUserPayload {
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface TicketUpdatedPayload {
  ticketId: string;
  ticket: any;
}

export interface QueueUpdatedPayload {
  // Empty payload, just notification
}

export interface ErrorPayload {
  message: string;
}
