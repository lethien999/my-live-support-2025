import { Server as SocketIOServer } from 'socket.io';

// Simple token validation (same as REST API)
const activeTokens = new Map<string, string>();

// Global database connection reference
let globalDbConnection: any = null;

// Set the global database connection
export function setGlobalDbConnection(connection: any) {
  globalDbConnection = connection;
}

// Socket events
export const SOCKET_EVENTS = {
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',
  USER_TYPING: 'user_typing',
  USER_STOPPED_TYPING: 'user_stopped_typing',
  ERROR: 'error'
} as const;

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
}

export class SimpleChatGateway {
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
        const token = socket.handshake.auth.token || 
                     socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('No token provided'));
        }

        // Use same token validation as REST API
        const userEmail = activeTokens.get(token);
        if (!userEmail) {
          return next(new Error('Invalid token'));
        }

        // Get user info from database
        const user = await this.getUserByEmail(userEmail);
        if (!user) {
          return next(new Error('User not found'));
        }

        // Attach user to socket
        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await globalDbConnection.query(`
        SELECT UserID, Email, FullName, 
               CASE 
                 WHEN Email = 'admin@muji.com' THEN 'Admin'
                 WHEN Email = 'agent@muji.com' THEN 'Agent'
                 ELSE 'Customer'
               END as Role
        FROM Users 
        WHERE Email = '${email}' AND Status = 'Active'
      `);
      
      // Connection will be closed automatically by the pool

      if (result.recordset.length === 0) {
        return null;
      }

      const userData = result.recordset[0];
      return {
        id: userData.UserID.toString(),
        email: userData.Email,
        name: userData.FullName,
        role: userData.Role
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: any) => {
      const user = socket.data.user as User;
      
      // console.log(`✅ User connected: ${user.name} (${user.email})`);

      // If user is agent, join global agents room and all active rooms
      if (user.role === 'Agent' || user.role === 'Admin') {
        socket.join('agents');
        // console.log(`🚪 Agent ${user.name} joined global agents room`);
        
        // Join all active chat rooms for agent monitoring
        this.joinAllActiveRooms(socket, user);
      }

      // Join room
      socket.on(SOCKET_EVENTS.JOIN_ROOM, async (data: { roomId: string }) => {
        try {
          await this.handleJoinRoom(socket, data.roomId, user);
          
          // If user is agent, also join agent room
          if (user.role === 'Agent' || user.role === 'Admin') {
            const agentRoomId = `${data.roomId}_agent`;
            socket.join(agentRoomId);
            // console.log(`🚪 Agent ${user.name} also joined agent room: ${agentRoomId}`);
          }
        } catch (error) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to join room' });
        }
      });

      // Leave room
      socket.on(SOCKET_EVENTS.LEAVE_ROOM, (data: { roomId: string }) => {
        this.handleLeaveRoom(socket, data.roomId, user);
      });

      // Send message
      socket.on(SOCKET_EVENTS.SEND_MESSAGE, async (data: {
        roomId: string;
        content: string;
        type?: string;
      }) => {
        try {
          await this.handleSendMessage(socket, data, user);
        } catch (error) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to send message' });
        }
      });

      // Typing indicator
      socket.on(SOCKET_EVENTS.USER_TYPING, (data: { roomId: string }) => {
        this.handleTyping(socket, data.roomId, user, true);
      });

      socket.on(SOCKET_EVENTS.USER_STOPPED_TYPING, (data: { roomId: string }) => {
        this.handleTyping(socket, data.roomId, user, false);
      });

      // Disconnect
      socket.on('disconnect', () => {
        // console.log(`❌ User disconnected: ${user.name}`);
        this.handleDisconnect(socket, user);
      });
    });
  }

  private async handleJoinRoom(socket: any, roomId: string, user: User) {
    try {
      // Check if room exists
      const config = {
        user: 'thien',
        password: '1909',
        server: 'localhost',
        database: 'live_support',
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      };

      const roomResult = await globalDbConnection.query(`
        SELECT RoomID FROM ChatRooms WHERE RoomID = ${parseInt(roomId)} AND Status = 'Active'
      `);
      
      if (roomResult.recordset.length === 0) {
        // Connection will be closed automatically by the pool
        throw new Error('Room not found');
      }

      // Join socket room
      socket.join(roomId);
      
      // Get recent messages
      const messagesResult = await globalDbConnection.query(`
        SELECT TOP 50 
          m.MessageID,
          m.Content,
          m.MessageType,
          m.CreatedAt,
          u.FullName as SenderName,
          u.UserID as SenderID,
          CASE 
            WHEN u.Email = 'admin@muji.com' THEN 'Admin'
            WHEN u.Email = 'agent@muji.com' THEN 'Agent'
            ELSE 'Customer'
          END as SenderRole
        FROM Messages m
        LEFT JOIN Users u ON m.SenderID = u.UserID
        WHERE m.RoomID = ${parseInt(roomId)}
        ORDER BY m.CreatedAt ASC
      `);
      
      // Connection will be closed automatically by the pool

      const messages: Message[] = messagesResult.recordset.map((msg: any) => ({
        id: msg.MessageID.toString(),
        roomId: roomId,
        senderId: msg.SenderID.toString(),
        content: msg.Content,
        type: msg.MessageType || 'text',
        createdAt: msg.CreatedAt.toISOString(),
        sender: {
          id: msg.SenderID.toString(),
          name: msg.SenderName || 'Unknown',
          role: msg.SenderRole || 'Customer'
        }
      }));

      // Send room data to user
      socket.emit(SOCKET_EVENTS.JOIN_ROOM, {
        roomId,
        messages,
        success: true
      });

      // Notify others in room
      socket.to(roomId).emit('user_joined', {
        user: {
          id: user.id,
          name: user.name,
          role: user.role
        }
      });

      // console.log(`✅ ${user.name} joined room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  }

  private handleLeaveRoom(socket: any, roomId: string, user: User) {
    socket.leave(roomId);
    
    // Remove from typing users
    const typingUsers = this.typingUsers.get(roomId);
    if (typingUsers) {
      typingUsers.delete(user.id);
      socket.to(roomId).emit(SOCKET_EVENTS.USER_STOPPED_TYPING, {
        userId: user.id,
        userName: user.name
      });
    }

    // Notify others in room
    socket.to(roomId).emit('user_left', {
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });

    console.log(`❌ ${user.name} left room ${roomId}`);
  }

  private async handleSendMessage(socket: any, data: {
    roomId: string;
    content: string;
    type?: string;
  }, user: User) {
    try {
      const config = {
        user: 'thien',
        password: '1909',
        server: 'localhost',
        database: 'live_support',
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      };

      // Insert message to database
      const messageResult = await globalDbConnection.query(`
        INSERT INTO Messages (RoomID, SenderID, Content, MessageType, CreatedAt, IsRead)
        VALUES (${parseInt(data.roomId)}, ${user.id}, '${data.content}', '${data.type || 'text'}', GETDATE(), 0);
        SELECT SCOPE_IDENTITY() as MessageID;
      `);
      
      const messageId = messageResult.recordset[0].MessageID;
      
      // Update room's last message time
      await globalDbConnection.query(`
        UPDATE ChatRooms SET LastMessageAt = GETDATE() WHERE RoomID = ${parseInt(data.roomId)}
      `);
      
      // Connection will be closed automatically by the pool

      // Create message object
      const message: Message = {
        id: messageId.toString(),
        roomId: data.roomId,
        senderId: user.id,
        content: data.content,
        type: data.type || 'text',
        createdAt: new Date().toISOString(),
        sender: {
          id: user.id,
          name: user.name,
          role: user.role
        }
      };

      // Broadcast to all users in room
      this.io.to(data.roomId).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, message);
      
      // Also broadcast to agent room (roomId + '_agent') for agent notifications
      const agentRoomId = `${data.roomId}_agent`;
      this.io.to(agentRoomId).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, message);
      
      // Broadcast to all agents globally (for agent dashboard)
      this.io.to('agents').emit(SOCKET_EVENTS.RECEIVE_MESSAGE, message);

      console.log(`💬 ${user.name} sent message in room ${data.roomId}: ${data.content}`);
      console.log(`📢 Message also broadcasted to agent room: ${agentRoomId} and global agents`);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  private handleTyping(socket: any, roomId: string, user: User, isTyping: boolean) {
    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Set());
    }

    const typingUsers = this.typingUsers.get(roomId)!;

    if (isTyping) {
      typingUsers.add(user.id);
    } else {
      typingUsers.delete(user.id);
    }

    // Broadcast typing status to room (except sender)
    socket.to(roomId).emit(isTyping ? SOCKET_EVENTS.USER_TYPING : SOCKET_EVENTS.USER_STOPPED_TYPING, {
      userId: user.id,
      userName: user.name,
      isTyping: isTyping
    });
  }

  private async joinAllActiveRooms(socket: any, user: User) {
    try {
      const config = {
        user: 'thien',
        password: '1909',
        server: 'localhost',
        database: 'live_support',
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      };

      // Get all active chat rooms
      const roomsResult = await globalDbConnection.query(`
        SELECT RoomID FROM ChatRooms WHERE IsActive = 1
      `);
      
      // Join all active rooms and their agent rooms
      for (const room of roomsResult.recordset) {
        const roomId = room.RoomID.toString();
        socket.join(roomId);
        socket.join(`${roomId}_agent`);
        // console.log(`🚪 Agent ${user.name} auto-joined room: ${roomId} and agent room: ${roomId}_agent`);
      }
      
      // console.log(`✅ Agent ${user.name} joined ${roomsResult.recordset.length} active rooms`);
    } catch (error) {
      console.error('Error joining all active rooms:', error);
    }
  }

  private handleDisconnect(socket: any, user: User) {
    // Remove from all typing lists
    for (const [roomId, typingUsers] of this.typingUsers.entries()) {
      if (typingUsers.has(user.id)) {
        typingUsers.delete(user.id);
        socket.to(roomId).emit(SOCKET_EVENTS.USER_STOPPED_TYPING, {
          userId: user.id,
          userName: user.name,
          isTyping: false
        });
      }
    }

    // console.log(`❌ ${user.name} disconnected`);
  }

  // Public method to update active tokens (called from REST API)
  public static updateActiveTokens(tokens: Map<string, string>) {
    activeTokens.clear();
    tokens.forEach((value, key) => {
      activeTokens.set(key, value);
    });
  }
}
