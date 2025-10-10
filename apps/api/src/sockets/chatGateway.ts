import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '@/libs/prisma';
import { config } from '@/config/env';
import logger from '@/config/logger';

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
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, config.jwtSecret) as any;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, name: true, role: true, status: true },
        });

        if (!user || user.status !== 'active') {
          return next(new Error('Authentication error: Invalid user'));
        }

        (socket as any).user = {
          userId: user.id,
          userRole: user.role,
          userName: user.name,
        };

        next();
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
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        ticket: {
          include: {
            customer: true,
            assignee: true,
          },
        },
      },
    });

    if (!room) {
      throw new Error('Room not found');
    }

    // Check access permissions
    const hasAccess = 
      user.userRole === 'admin' ||
      user.userRole === 'agent' ||
      room.ticket.customerId === user.userId;

    if (!hasAccess) {
      throw new Error('Access denied to this room');
    }

    socket.join(roomId);
    
    // Send room info and recent messages
    const messages = await prisma.message.findMany({
      where: { roomId },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
        file: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 50, // Last 50 messages
    });

    socket.emit(SOCKET_EVENTS.CHAT_JOIN, {
      roomId,
      messages,
      ticket: room.ticket,
    });

    logger.info('User joined room', { 
      userId: user.userId, 
      roomId 
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
    // Verify room access
    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
      include: { ticket: true },
    });

    if (!room) {
      throw new Error('Room not found');
    }

    // Check access permissions
    const hasAccess = 
      user.userRole === 'admin' ||
      user.userRole === 'agent' ||
      room.ticket.customerId === user.userId;

    if (!hasAccess) {
      throw new Error('Access denied to this room');
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        roomId: data.roomId,
        senderId: user.userId,
        type: data.type as any,
        content: data.content,
        fileId: data.fileId,
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
        file: true,
      },
    });

    // Broadcast message to room
    this.io.to(data.roomId).emit(SOCKET_EVENTS.MESSAGE_RECEIVE, message);

    logger.info('Message sent', { 
      messageId: message.id, 
      roomId: data.roomId, 
      senderId: user.userId 
    });
  }

  private handleTyping(socket: any, data: { roomId: string; isTyping: boolean }, user: AuthenticatedSocket) {
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
