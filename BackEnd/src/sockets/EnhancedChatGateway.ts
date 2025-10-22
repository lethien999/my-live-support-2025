// Enhanced Chat Gateway based on Graduation-Thesis architecture
import { Server as SocketIOServer } from 'socket.io';
import sql from 'mssql';
import logger from '../config/logger';
import { getConnection } from '../db';
import { HybridTokenService } from '../services/HybridTokenService';

// Enhanced interfaces
export interface AuthenticatedSocket {
  userId: string;
  userRole: string;
  userName: string;
  userEmail: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: 'Customer' | 'Agent' | 'Admin';
  roomId: string;
  timestamp: string;
  type: 'text' | 'image' | 'file' | 'system';
  isRead?: boolean;
  fileUrl?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  agentId?: string;
  agentName?: string;
  ticketId?: string;
  ticketNumber?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface TypingUser {
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface OnlineStatus {
  userId: string;
  userName: string;
  isOnline: boolean;
  lastSeen?: string;
}

// Enhanced Socket Events
export const ENHANCED_SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Room events
  ROOM_JOIN: 'chat:join',
  ROOM_LEAVE: 'chat:leave',
  ROOM_CREATE: 'room:create',
  ROOM_UPDATE: 'room:updated',
  
  // Message events
  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVE: 'message:receive',
  MESSAGE_READ: 'message:read',
  MESSAGE_DELETE: 'message:delete',
  
  // Typing events
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  TYPING_STATUS: 'typing',
  
  // Online status events
  ONLINE_STATUS: 'online_status',
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  
  // File events
  FILE_UPLOAD: 'file:upload',
  FILE_DOWNLOAD: 'file:download',
  
  // Notification events
  NOTIFICATION: 'notification',
  TICKET_UPDATE: 'ticket:updated',
  QUEUE_UPDATE: 'queue:updated',
  
  // Error events
  ERROR: 'error',
  AUTH_ERROR: 'auth:error'
} as const;

export class EnhancedChatGateway {
  private io: SocketIOServer;
  private typingUsers: Map<string, Map<string, TypingUser>> = new Map();
  private onlineUsers: Map<string, Map<string, OnlineStatus>> = new Map();
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private roomUsers: Map<string, Set<string>> = new Map(); // roomId -> Set of userIds

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupCleanupInterval();
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
          // Use HybridTokenService for validation
          const validation = await HybridTokenService.validateToken(token);
          logger.info('Socket auth - Hybrid token validation:', { 
            isValid: validation.isValid, 
            userEmail: validation.userEmail,
            source: validation.source 
          });
          
          if (!validation.isValid || !validation.userEmail || !validation.userId) {
            logger.warn('Socket auth - Invalid token');
            return next(new Error('Authentication error: Invalid token'));
          }

          // Get user info from database
          const sql = await getConnection();
          const userResult = await sql.query`
            SELECT UserID, Email, Role, FirstName, LastName
            FROM Users 
            WHERE Email = ${validation.userEmail}
          `;

          if (userResult.recordset.length === 0) {
            logger.warn('Socket auth - User not found:', validation.userEmail);
            return next(new Error('Authentication error: User not found'));
          }

          const user = userResult.recordset[0];
          
          (socket as any).user = {
            userId: user.UserID.toString(),
            userRole: user.Role,
            userName: `${user.FirstName} ${user.LastName}`.trim() || user.Email,
            userEmail: user.Email
          };

          logger.info('Socket auth - User authenticated via Hybrid:', (socket as any).user);
          next();
        } catch (tokenError: any) {
          logger.error('Socket auth - Hybrid token validation error:', tokenError);
          return next(new Error('Authentication error: Token validation failed'));
        }
      } catch (error) {
        logger.error('Socket authentication error:', error);
        return next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: any) => {
      const user = socket.user as AuthenticatedSocket;
      
      logger.info('User connected to enhanced socket', { 
        userId: user.userId, 
        socketId: socket.id,
        userRole: user.userRole
      });

      // Track user socket
      this.trackUserSocket(user.userId, socket.id);

      // Room management
      socket.on(ENHANCED_SOCKET_EVENTS.ROOM_JOIN, async (data: { roomId: string }) => {
        try {
          await this.handleJoinRoom(socket, data.roomId, user);
        } catch (error) {
          logger.error('Join room error:', error);
          socket.emit(ENHANCED_SOCKET_EVENTS.ERROR, { message: 'Failed to join room' });
        }
      });

      socket.on(ENHANCED_SOCKET_EVENTS.ROOM_LEAVE, (data: { roomId: string }) => {
        this.handleLeaveRoom(socket, data.roomId, user);
      });

      // Message handling
      socket.on(ENHANCED_SOCKET_EVENTS.MESSAGE_SEND, async (data: {
        roomId: string;
        type: 'text' | 'image' | 'file';
        content: string;
        fileId?: string;
      }) => {
        try {
          await this.handleSendMessage(socket, data, user);
        } catch (error) {
          logger.error('Send message error:', error);
          socket.emit(ENHANCED_SOCKET_EVENTS.ERROR, { message: 'Failed to send message' });
        }
      });

      // Typing indicators
      socket.on(ENHANCED_SOCKET_EVENTS.TYPING_START, (data: { roomId: string }) => {
        this.handleTypingStart(socket, data.roomId, user);
      });

      socket.on(ENHANCED_SOCKET_EVENTS.TYPING_STOP, (data: { roomId: string }) => {
        this.handleTypingStop(socket, data.roomId, user);
      });

      // Message read status
      socket.on(ENHANCED_SOCKET_EVENTS.MESSAGE_READ, async (data: { roomId: string; messageIds: string[] }) => {
        try {
          await this.handleMessageRead(socket, data, user);
        } catch (error) {
          logger.error('Message read error:', error);
        }
      });

      // Disconnect handling
      socket.on('disconnect', (reason: string) => {
        logger.info('User disconnected from enhanced socket', { 
          userId: user.userId, 
          socketId: socket.id,
          reason
        });
        this.handleDisconnect(socket, user);
      });
    });
  }

  private async handleJoinRoom(socket: any, roomId: string, user: AuthenticatedSocket) {
    try {
      // Verify room access
      const sql = await getConnection();
      const roomResult = await sql.query`
        SELECT RoomID, RoomName, CustomerID, AgentID, IsActive
        FROM ChatRooms 
        WHERE RoomID = ${roomId} AND IsActive = 1
      `;

      if (roomResult.recordset.length === 0) {
        socket.emit(ENHANCED_SOCKET_EVENTS.ERROR, { message: 'Room not found or inactive' });
        return;
      }

      const room = roomResult.recordset[0];
      
      // Check if user has access to this room
      const hasAccess = user.userRole === 'Admin' || 
                       room.CustomerID.toString() === user.userId || 
                       room.AgentID?.toString() === user.userId;

      if (!hasAccess) {
        socket.emit(ENHANCED_SOCKET_EVENTS.ERROR, { message: 'Access denied to this room' });
        return;
      }

      // Join socket room
      socket.join(roomId);
      
      // Track room user
      if (!this.roomUsers.has(roomId)) {
        this.roomUsers.set(roomId, new Set());
      }
      this.roomUsers.get(roomId)!.add(user.userId);

      // Set user online status
      this.setUserOnlineStatus(roomId, user, true);

      // Send room join confirmation
      socket.emit(ENHANCED_SOCKET_EVENTS.ROOM_UPDATE, {
        roomId,
        message: `${user.userName} joined the room`
      });

      // Notify other users in room
      socket.to(roomId).emit(ENHANCED_SOCKET_EVENTS.USER_ONLINE, {
        userId: user.userId,
        userName: user.userName,
        isOnline: true
      });

      logger.info('User joined room', { userId: user.userId, roomId });

    } catch (error) {
      logger.error('Error joining room:', error);
      throw error;
    }
  }

  private handleLeaveRoom(socket: any, roomId: string, user: AuthenticatedSocket) {
    socket.leave(roomId);
    
    // Remove from room users
    const roomUserSet = this.roomUsers.get(roomId);
    if (roomUserSet) {
      roomUserSet.delete(user.userId);
      if (roomUserSet.size === 0) {
        this.roomUsers.delete(roomId);
      }
    }

    // Set user offline status
    this.setUserOnlineStatus(roomId, user, false);

    // Notify other users
    socket.to(roomId).emit(ENHANCED_SOCKET_EVENTS.USER_OFFLINE, {
      userId: user.userId,
      userName: user.userName,
      isOnline: false
    });

    logger.info('User left room', { userId: user.userId, roomId });
  }

  private async handleSendMessage(socket: any, data: {
    roomId: string;
    type: 'text' | 'image' | 'file';
    content: string;
    fileId?: string;
  }, user: AuthenticatedSocket) {
    try {
      const { roomId, type, content, fileId } = data;

      // Save message to database
      const sql = await getConnection();
      const messageResult = await sql.query`
        INSERT INTO Messages (RoomID, SenderID, Content, MessageType, FileID, CreatedAt)
        OUTPUT INSERTED.MessageID
        VALUES (${roomId}, ${user.userId}, ${content}, ${type}, ${fileId || null}, GETDATE())
      `;

      const messageId = messageResult.recordset[0].MessageID;

      // Create message object
      const message: ChatMessage = {
        id: messageId.toString(),
        content,
        senderId: user.userId,
        senderName: user.userName,
        senderRole: user.userRole as 'Customer' | 'Agent' | 'Admin',
        roomId,
        timestamp: new Date().toISOString(),
        type,
        isRead: false,
        fileUrl: fileId ? `/api/files/${fileId}` : undefined
      };

      // Broadcast message to room
      this.io.to(roomId).emit(ENHANCED_SOCKET_EVENTS.MESSAGE_RECEIVE, message);

      // Update room last message
      await sql.query`
        UPDATE ChatRooms 
        SET LastMessage = ${content}, LastMessageAt = GETDATE()
        WHERE RoomID = ${roomId}
      `;

      logger.info('Message sent', { messageId, roomId, senderId: user.userId });

    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  private handleTypingStart(socket: any, roomId: string, user: AuthenticatedSocket) {
    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Map());
    }

    const typingUser: TypingUser = {
      userId: user.userId,
      userName: user.userName,
      isTyping: true
    };

    this.typingUsers.get(roomId)!.set(user.userId, typingUser);

    // Broadcast typing status
    socket.to(roomId).emit(ENHANCED_SOCKET_EVENTS.TYPING_STATUS, {
      roomId,
      users: Array.from(this.typingUsers.get(roomId)!.values())
    });
  }

  private handleTypingStop(socket: any, roomId: string, user: AuthenticatedSocket) {
    const roomTypingUsers = this.typingUsers.get(roomId);
    if (roomTypingUsers) {
      roomTypingUsers.delete(user.userId);
      
      // Broadcast updated typing status
      socket.to(roomId).emit(ENHANCED_SOCKET_EVENTS.TYPING_STATUS, {
        roomId,
        users: Array.from(roomTypingUsers.values())
      });
    }
  }

  private async handleMessageRead(socket: any, data: { roomId: string; messageIds: string[] }, user: AuthenticatedSocket) {
    try {
      const { roomId, messageIds } = data;

      // Update message read status in database
      const sql = await getConnection();
      await sql.query`
        UPDATE Messages 
        SET IsRead = 1, ReadAt = GETDATE()
        WHERE MessageID IN (${messageIds.join(',')}) 
        AND RoomID = ${roomId}
        AND SenderID != ${user.userId}
      `;

      // Notify other users in room
      socket.to(roomId).emit(ENHANCED_SOCKET_EVENTS.MESSAGE_READ, {
        roomId,
        messageIds,
        readBy: user.userId
      });

      logger.info('Messages marked as read', { roomId, messageIds, userId: user.userId });

    } catch (error) {
      logger.error('Error marking messages as read:', error);
      throw error;
    }
  }

  private setUserOnlineStatus(roomId: string, user: AuthenticatedSocket, isOnline: boolean) {
    if (!this.onlineUsers.has(roomId)) {
      this.onlineUsers.set(roomId, new Map());
    }

    const onlineStatus: OnlineStatus = {
      userId: user.userId,
      userName: user.userName,
      isOnline,
      lastSeen: isOnline ? undefined : new Date().toISOString()
    };

    this.onlineUsers.get(roomId)!.set(user.userId, onlineStatus);
  }

  private trackUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  private handleDisconnect(socket: any, user: AuthenticatedSocket) {
    // Remove socket from user tracking
    const userSocketSet = this.userSockets.get(user.userId);
    if (userSocketSet) {
      userSocketSet.delete(socket.id);
      if (userSocketSet.size === 0) {
        this.userSockets.delete(user.userId);
        
        // Set user offline in all rooms
        for (const [roomId, roomUserSet] of this.roomUsers.entries()) {
          if (roomUserSet.has(user.userId)) {
            this.setUserOnlineStatus(roomId, user, false);
            
            // Notify room users
            this.io.to(roomId).emit(ENHANCED_SOCKET_EVENTS.USER_OFFLINE, {
              userId: user.userId,
              userName: user.userName,
              isOnline: false
            });
          }
        }
      }
    }

    // Clean up typing status
    for (const [roomId, roomTypingUsers] of this.typingUsers.entries()) {
      if (roomTypingUsers.has(user.userId)) {
        roomTypingUsers.delete(user.userId);
        
        // Broadcast updated typing status
        this.io.to(roomId).emit(ENHANCED_SOCKET_EVENTS.TYPING_STATUS, {
          roomId,
          users: Array.from(roomTypingUsers.values())
        });
      }
    }
  }

  private setupCleanupInterval() {
    // Clean up inactive typing users every 30 seconds
    setInterval(() => {
      const now = Date.now();
      for (const [roomId, roomTypingUsers] of this.typingUsers.entries()) {
        const toDelete: string[] = [];
        
        for (const [userId, typingUser] of roomTypingUsers.entries()) {
          // Remove typing status after 5 seconds of inactivity
          if (now - (typingUser as any).lastActivity > 5000) {
            toDelete.push(userId);
          }
        }
        
        toDelete.forEach(userId => roomTypingUsers.delete(userId));
        
        if (roomTypingUsers.size === 0) {
          this.typingUsers.delete(roomId);
        }
      }
    }, 30000);
  }

  // Public methods for external use
  public getOnlineUsers(roomId: string): OnlineStatus[] {
    const roomOnlineUsers = this.onlineUsers.get(roomId);
    return roomOnlineUsers ? Array.from(roomOnlineUsers.values()) : [];
  }

  public getTypingUsers(roomId: string): TypingUser[] {
    const roomTypingUsers = this.typingUsers.get(roomId);
    return roomTypingUsers ? Array.from(roomTypingUsers.values()) : [];
  }

  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  public sendNotificationToUser(userId: string, notification: any) {
    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet) {
      userSocketSet.forEach(socketId => {
        this.io.to(socketId).emit(ENHANCED_SOCKET_EVENTS.NOTIFICATION, notification);
      });
    }
  }

  public broadcastToRoom(roomId: string, event: string, data: any) {
    this.io.to(roomId).emit(event, data);
  }
}
