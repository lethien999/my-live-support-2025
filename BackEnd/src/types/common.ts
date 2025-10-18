export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  assignee?: string;
  customer?: string;
  q?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  type: string;
  content: string;
  fileId?: string;
  createdAt: Date;
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

export interface TypingUser {
  userId: string;
  name: string;
  isTyping: boolean;
}
