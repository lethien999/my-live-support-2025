// src/types.ts
export interface SocketMessage {
  roomId: string;
  senderId: string;
  body: string;
  createdAt?: string;
}

export interface RoomJoinPayload {
  roomId: string;
}

export interface RoomLeavePayload {
  roomId: string;
}

export interface ChatSendPayload {
  roomId: string;
  senderId: string;
  body: string;
}

export interface ChatNewPayload {
  id: string;
  roomId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface SocketAck {
  ok: boolean;
  error?: string;
}

export interface MessageRecord {
  id: string;
  roomId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface DatabaseConfig {
  user: string;
  password: string;
  server: string;
  database: string;
  port?: number;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
  };
  pool?: {
    max: number;
    min: number;
    idleTimeoutMillis: number;
    acquireTimeoutMillis: number;
    createTimeoutMillis: number;
    destroyTimeoutMillis: number;
    reapIntervalMillis: number;
    createRetryIntervalMillis: number;
  };
}
