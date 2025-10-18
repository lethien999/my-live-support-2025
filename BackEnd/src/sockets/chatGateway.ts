import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import sql from 'mssql';
import { config } from '../config/env';
import logger from '../config/logger';
import { getConnection } from '../db';
import { redisService } from '../services/redisService';

// Hardcoded users for authentication
const hardcodedUsers = [
  { id: 1, email: 'admin@muji.com', name: 'Quản trị viên hệ thống', role: 'Admin', status: 'active' },
  { id: 2, email: 'agent@muji.com', name: 'Nhân viên hỗ trợ', role: 'Agent', status: 'active' },
  { id: 3, email: 'customer@muji.com', name: 'Khách hàng mẫu', role: 'Customer', status: 'active' }
];

// Socket event constants
export const SOCKET_EVENTS = {
  CHAT_JOIN: 'chat:join',
  CHAT_LEAVE: 'chat:leave',
  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVE: 'message:receive',
  TYPING: 'typing',
  TICKET_UPDATED: 'ticket:updated',
  QUEUE_UPDATED: 'queue:updated',
} as const;

interface AuthenticatedSocket {
  userId: string;
  userRole: string;
  userName: string;
}

export class ChatGateway {
  private io: SocketIOServer;
  private typingUsers: Map<string, Set<string>> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          logger.warn('Socket auth - No token provided');
          return next(new Error('Authentication error: No token provided'));
        }

        try {
          const decoded = jwt.verify(token, config.jwtSecret) as any;
          logger.info('Socket auth - Decoded token:', { userId: decoded.userId, email: decoded.email, role: decoded.role });
          
          // Convert userId to number for comparison
          const userId = parseInt(decoded.userId);
          const user = hardcodedUsers.find(u => u.id === userId);
          logger.info('Socket auth - Looking for user:', { userId, foundUser: user });
          
          if (!user || user.status !== 'active') {
            logger.warn('Socket auth - Invalid user:', { userId, user });
            return next(new Error('Authentication error: Invalid user'));
          }

          (socket as any).user = {
            userId: user.id,
            userRole: user.role,
            userName: user.name,
          };

          next();
        } catch (jwtError: any) {
          if (jwtError.name === 'TokenExpiredError') {
            logger.warn('Socket auth - Token expired, allowing connection for testing');
            // For testing purposes, allow connection with a default user
            (socket as any).user = {
              userId: 3, // Default to customer user
              userRole: 'Customer',
              userName: 'Test User',
            };
            next();
          } else {
            logger.error('Socket auth - JWT verification error:', jwtError);
            return next(new Error('Authentication error: Invalid token'));
          }
        }
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: any) => {
      const user = socket.user as AuthenticatedSocket;
      
      logger.info('User connected to socket', { 
        userId: user.userId, 
        socketId: socket.id 
      });

      // Join chat room
      socket.on(SOCKET_EVENTS.CHAT_JOIN, async (data: { roomId: string }) => {
        try {
          await this.handleJoinRoom(socket, data.roomId, user);
        } catch (error) {
          logger.error('Join room error:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      // Leave chat room
      socket.on(SOCKET_EVENTS.CHAT_LEAVE, (data: { roomId: string }) => {
        this.handleLeaveRoom(socket, data.roomId, user);
      });

      // Send message
      socket.on(SOCKET_EVENTS.MESSAGE_SEND, async (data: {
        roomId: string;
        type: string;
        content: string;
        fileId?: string;
      }) => {
        try {
          await this.handleSendMessage(socket, data, user);
        } catch (error) {
          logger.error('Send message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Typing indicator
      socket.on(SOCKET_EVENTS.TYPING, (data: { roomId: string; isTyping: boolean }) => {
        this.handleTyping(socket, data, user);
      });

      // Disconnect
      socket.on('disconnect', () => {
        logger.info('User disconnected from socket', { 
          userId: user.userId, 
          socketId: socket.id 
        });
        this.handleDisconnect(socket, user);
      });
    });
  }

  private async handleJoinRoom(socket: any, roomId: string, user: AuthenticatedSocket) {
    // Check if user has access to this room
    const pool = await getConnection();
    const room = await sql.query`SELECT * FROM ChatRooms WHERE RoomID = ${parseInt(roomId)}`;

    if (!room.recordset || room.recordset.length === 0) {
      throw new Error('Room not found');
    }

    // Simplified access check - allow all authenticated users
    const hasAccess = true;

    socket.join(roomId);
    
    // Add user to room in Redis if available
    if (redisService.isReady()) {
      try {
        await redisService.addUserToRoom(roomId, user.userId);
        logger.info('User added to room via Redis', { userId: user.userId, roomId });
      } catch (redisError) {
        logger.warn('Failed to add user to room in Redis', redisError);
      }
    }
    
    // Send room info and recent messages
    const messagesResult = await sql.query`
      SELECT TOP 50 m.MessageID, m.Content, m.MessageType, m.CreatedAt, u.FullName as SenderName
      FROM Messages m
      LEFT JOIN Users u ON m.SenderID = u.UserID
      WHERE m.RoomID = ${parseInt(roomId)}
      ORDER BY m.CreatedAt ASC
    `;
    
    const messages = messagesResult.recordset.map(msg => ({
      id: msg.MessageID.toString(),
      content: msg.Content,
      type: msg.MessageType,
      createdAt: msg.CreatedAt,
      sender: {
        name: msg.SenderName || 'Unknown'
      }
    }));

    socket.emit(SOCKET_EVENTS.CHAT_JOIN, {
      roomId,
      messages,
      ticket: null,
    });

    logger.info('User joined room', { 
      userId: user.userId, 
      roomId,
      method: redisService.isReady() ? 'Redis + SQL' : 'SQL only'
    });
  }

  private handleLeaveRoom(socket: any, roomId: string, user: AuthenticatedSocket) {
    socket.leave(roomId);
    
    // Remove from typing users
    const typingUsers = this.typingUsers.get(roomId);
    if (typingUsers) {
      typingUsers.delete(user.userId);
      socket.to(roomId).emit(SOCKET_EVENTS.TYPING, {
        userId: user.userId,
        userName: user.userName,
        isTyping: false,
      });
    }

    logger.info('User left room', { 
      userId: user.userId, 
      roomId 
    });
  }

  private async handleSendMessage(socket: any, data: {
    roomId: string;
    type: string;
    content: string;
    fileId?: string;
  }, user: AuthenticatedSocket) {
    try {
      const pool = await getConnection();
      
      // Create message in SQL Server
      const messageResult = await sql.query`
        INSERT INTO Messages (RoomID, SenderID, MessageType, Content, CreatedAt, IsRead)
        VALUES (${parseInt(data.roomId)}, ${user.userId}, ${data.type}, ${data.content}, GETDATE(), 0);
        SELECT SCOPE_IDENTITY() as MessageID;
      `;
      
      const messageId = messageResult.recordset[0].MessageID;
      
      // Get sender info
      const senderInfo = hardcodedUsers.find(u => u.id === parseInt(user.userId.toString()));
      
      const message = {
        id: messageId.toString(),
        roomId: data.roomId,
        senderId: user.userId,
        type: data.type,
        content: data.content,
        createdAt: new Date().toISOString(),
        sender: {
          id: user.userId,
          name: senderInfo?.name || 'Unknown',
          role: user.userRole
        }
      };

      // REAL-TIME: Broadcast via Redis if available, fallback to Socket.IO
      if (redisService.isReady()) {
        try {
          await redisService.publishMessage(data.roomId, message);
          logger.info('Message published via Redis', { messageId, roomId: data.roomId });
        } catch (redisError) {
          logger.warn('Redis publish failed, using Socket.IO fallback', redisError);
          this.io.to(data.roomId).emit(SOCKET_EVENTS.MESSAGE_RECEIVE, message);
        }
      } else {
        // Fallback to direct Socket.IO broadcast
        this.io.to(data.roomId).emit(SOCKET_EVENTS.MESSAGE_RECEIVE, message);
      }

      // Cache message in Redis for quick access
      if (redisService.isReady()) {
        try {
          await redisService.cacheMessage(data.roomId, messageId.toString(), message);
        } catch (cacheError) {
          logger.warn('Failed to cache message in Redis', cacheError);
        }
      }

      logger.info('Message sent successfully', { 
        messageId: messageId,
        roomId: data.roomId,
        senderId: user.userId,
        content: data.content,
        method: redisService.isReady() ? 'Redis' : 'Socket.IO'
      });
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  private async handleTyping(socket: any, data: { roomId: string; isTyping: boolean }, user: AuthenticatedSocket) {
    // Use Redis for typing indicators if available
    if (redisService.isReady()) {
      try {
        await redisService.setTyping(data.roomId, user.userId, data.isTyping);
        
        // Broadcast typing status to room
        socket.to(data.roomId).emit(SOCKET_EVENTS.TYPING, {
          userId: user.userId,
          userName: user.userName,
          isTyping: data.isTyping,
        });
        
        logger.info('Typing status updated via Redis', { 
          roomId: data.roomId, 
          userId: user.userId, 
          isTyping: data.isTyping 
        });
        return;
      } catch (redisError) {
        logger.warn('Redis typing update failed, using fallback', redisError);
      }
    }

    // Fallback to in-memory typing tracking
    if (!this.typingUsers.has(data.roomId)) {
      this.typingUsers.set(data.roomId, new Set());
    }

    const typingUsers = this.typingUsers.get(data.roomId)!;

    if (data.isTyping) {
      typingUsers.add(user.userId);
    } else {
      typingUsers.delete(user.userId);
    }

    socket.to(data.roomId).emit(SOCKET_EVENTS.TYPING, {
      userId: user.userId,
      userName: user.userName,
      isTyping: data.isTyping,
    });
  }

  private handleDisconnect(socket: any, user: AuthenticatedSocket) {
    // Remove from all typing lists
    for (const [roomId, typingUsers] of this.typingUsers.entries()) {
      if (typingUsers.has(user.userId)) {
        typingUsers.delete(user.userId);
        socket.to(roomId).emit(SOCKET_EVENTS.TYPING, {
          userId: user.userId,
          userName: user.userName,
          isTyping: false,
        });
      }
    }
  }

  // Public methods for external use
  public emitTicketUpdate(ticketId: string, ticket: any) {
    this.io.emit(SOCKET_EVENTS.TICKET_UPDATED, { ticketId, ticket });
  }

  public emitQueueUpdate() {
    this.io.emit(SOCKET_EVENTS.QUEUE_UPDATED);
  }
}
