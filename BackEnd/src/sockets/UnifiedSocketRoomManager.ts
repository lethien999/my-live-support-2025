// Unified Socket Room Management
import { Server as SocketIOServer } from 'socket.io';
import { getConnection } from '../db';
import logger from '../config/logger';

export interface RoomUser {
  userId: string;
  userName: string;
  userRole: string;
  socketId: string;
  joinedAt: Date;
  isOnline: boolean;
}

export interface RoomInfo {
  roomId: string;
  roomName: string;
  customerId: string;
  agentId?: string;
  isActive: boolean;
  users: RoomUser[];
  lastMessage?: string;
  lastMessageAt?: Date;
}

export class UnifiedSocketRoomManager {
  private io: SocketIOServer;
  private roomUsers: Map<string, Map<string, RoomUser>> = new Map(); // roomId -> userId -> RoomUser
  private userRooms: Map<string, Set<string>> = new Map(); // userId -> Set of roomIds
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: any) => {
      console.log('🔌 Client connected:', socket.id);

      // User authentication
      socket.on('authenticate', async (data: { token: string }) => {
        try {
          const user = await this.authenticateUser(data.token);
          if (user) {
            socket.userId = user.userId;
            socket.userName = user.userName;
            socket.userRole = user.userRole;
            socket.userEmail = user.userEmail;
            
            this.socketUsers.set(socket.id, user.userId);
            
            socket.emit('authenticated', { 
              userId: user.userId, 
              userName: user.userName,
              userRole: user.userRole 
            });
            
            console.log(`✅ User authenticated: ${user.userName} (${user.userRole})`);
          } else {
            socket.emit('auth_error', { message: 'Invalid token' });
          }
        } catch (error) {
          console.error('❌ Authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Join room
      socket.on('join_room', async (data: { roomId: string }) => {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        try {
          await this.joinRoom(socket, data.roomId);
        } catch (error) {
          console.error('❌ Join room error:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      // Leave room
      socket.on('leave_room', (data: { roomId: string }) => {
        if (!socket.userId) return;
        this.leaveRoom(socket, data.roomId);
      });

      // Send message
      socket.on('send_message', async (data: { roomId: string; content: string; type?: string }) => {
        if (!socket.userId) return;
        
        try {
          await this.sendMessage(socket, data.roomId, data.content, data.type || 'text');
        } catch (error) {
          console.error('❌ Send message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Typing indicator
      socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
        if (!socket.userId) return;
        this.handleTyping(socket, data.roomId, data.isTyping);
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
        this.handleDisconnect(socket);
      });
    });
  }

  private async authenticateUser(token: string): Promise<any> {
    // Get user from token (implement your token validation logic)
    const sql = await getConnection();
    const result = await sql.query`
      SELECT u.UserID, u.FullName, u.Email, u.Role
      FROM Users u
      WHERE u.Email = 'customer@muji.com' OR u.Email = 'agent@muji.com'
    `;
    
    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      return {
        userId: user.UserID.toString(),
        userName: user.FullName,
        userRole: user.Role || 'Customer',
        userEmail: user.Email
      };
    }
    
    return null;
  }

  private async joinRoom(socket: any, roomId: string) {
    const userId = socket.userId;
    const userName = socket.userName;
    const userRole = socket.userRole;

    // Verify room exists and user has access
    const sql = await getConnection();
    const roomResult = await sql.query`
      SELECT RoomID, RoomName, CustomerID, AgentID, IsActive
      FROM ChatRooms 
      WHERE RoomID = ${parseInt(roomId)} AND IsActive = 1
    `;

    if (roomResult.recordset.length === 0) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    const room = roomResult.recordset[0];
    
    // Check access permissions
    const hasAccess = userRole === 'Admin' || 
                     room.CustomerID.toString() === userId || 
                     room.AgentID?.toString() === userId;

    if (!hasAccess) {
      socket.emit('error', { message: 'Access denied' });
      return;
    }

    // Join socket room
    socket.join(roomId);
    
    // Track user in room
    if (!this.roomUsers.has(roomId)) {
      this.roomUsers.set(roomId, new Map());
    }
    
    const roomUser: RoomUser = {
      userId,
      userName,
      userRole,
      socketId: socket.id,
      joinedAt: new Date(),
      isOnline: true
    };
    
    this.roomUsers.get(roomId)!.set(userId, roomUser);
    
    // Track user's rooms
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId)!.add(roomId);

    // Notify room users
    socket.to(roomId).emit('user_joined', {
      userId,
      userName,
      userRole,
      roomId
    });

    // Send room info to user
    const roomInfo = await this.getRoomInfo(roomId);
    socket.emit('room_joined', {
      roomId,
      roomInfo,
      users: Array.from(this.roomUsers.get(roomId)?.values() || [])
    });

    console.log(`✅ User ${userName} joined room ${roomId}`);
  }

  private leaveRoom(socket: any, roomId: string) {
    const userId = socket.userId;
    if (!userId) return;

    socket.leave(roomId);
    
    // Remove user from room tracking
    if (this.roomUsers.has(roomId)) {
      this.roomUsers.get(roomId)!.delete(userId);
    }
    
    if (this.userRooms.has(userId)) {
      this.userRooms.get(userId)!.delete(roomId);
    }

    // Notify room users
    socket.to(roomId).emit('user_left', {
      userId,
      roomId
    });

    console.log(`✅ User ${userId} left room ${roomId}`);
  }

  private async sendMessage(socket: any, roomId: string, content: string, type: string) {
    const userId = socket.userId;
    const userName = socket.userName;
    const userRole = socket.userRole;

    // Save message to database
    const sql = await getConnection();
    await sql.query`
      INSERT INTO Messages (RoomID, SenderID, SenderType, Content, MessageType, CreatedAt)
      VALUES (${parseInt(roomId)}, ${parseInt(userId)}, ${userRole}, ${content}, ${type}, GETDATE())
    `;

    // Update room last message
    await sql.query`
      UPDATE ChatRooms 
      SET LastMessage = ${content}, LastMessageAt = GETDATE()
      WHERE RoomID = ${parseInt(roomId)}
    `;

    // Broadcast message to room
    const message = {
      id: Date.now().toString(),
      roomId,
      content,
      type,
      sender: {
        id: userId,
        name: userName,
        role: userRole
      },
      createdAt: new Date().toISOString()
    };

    this.io.to(roomId).emit('message_received', message);
    
    console.log(`📨 Message sent in room ${roomId}: ${content}`);
  }

  private handleTyping(socket: any, roomId: string, isTyping: boolean) {
    const userId = socket.userId;
    const userName = socket.userName;

    socket.to(roomId).emit('user_typing', {
      userId,
      userName,
      isTyping,
      roomId
    });
  }

  private handleDisconnect(socket: any) {
    const userId = socket.userId;
    if (!userId) return;

    // Remove from socket tracking
    this.socketUsers.delete(socket.id);

    // Leave all rooms
    if (this.userRooms.has(userId)) {
      const rooms = Array.from(this.userRooms.get(userId)!);
      rooms.forEach(roomId => {
        socket.to(roomId).emit('user_left', {
          userId,
          roomId
        });
      });
      this.userRooms.delete(userId);
    }

    console.log(`✅ User ${userId} disconnected from all rooms`);
  }

  private async getRoomInfo(roomId: string): Promise<RoomInfo> {
    const sql = await getConnection();
    const result = await sql.query`
      SELECT RoomID, RoomName, CustomerID, AgentID, IsActive, LastMessage, LastMessageAt
      FROM ChatRooms 
      WHERE RoomID = ${parseInt(roomId)}
    `;

    if (result.recordset.length === 0) {
      throw new Error('Room not found');
    }

    const room = result.recordset[0];
    const users = Array.from(this.roomUsers.get(roomId)?.values() || []);

    return {
      roomId: room.RoomID.toString(),
      roomName: room.RoomName,
      customerId: room.CustomerID.toString(),
      agentId: room.AgentID?.toString(),
      isActive: room.IsActive,
      users,
      lastMessage: room.LastMessage,
      lastMessageAt: room.LastMessageAt
    };
  }

  // Public methods for external use
  public getRoomUsers(roomId: string): RoomUser[] {
    return Array.from(this.roomUsers.get(roomId)?.values() || []);
  }

  public getUserRooms(userId: string): string[] {
    return Array.from(this.userRooms.get(userId) || []);
  }

  public isUserInRoom(userId: string, roomId: string): boolean {
    return this.userRooms.get(userId)?.has(roomId) || false;
  }
}
