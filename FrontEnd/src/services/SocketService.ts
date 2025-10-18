import { io, Socket } from 'socket.io-client';
import AuthChatService from './AuthChatService';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  roomId: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
}

interface Room {
  id: string;
  name: string;
  type: 'customer-shop' | 'agent-customer';
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  isActive: boolean;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private connectionTimeout: NodeJS.Timeout | null = null;

  // Event handlers
  private messageHandlers: Array<(message: Message) => void> = [];
  private roomHandlers: Array<(rooms: Room[]) => void> = [];
  private connectionHandlers: Array<(connected: boolean) => void> = [];
  private typingHandlers: Array<(data: { roomId: string; user: string; isTyping: boolean }) => void> = [];

  // Performance optimization
  private messageQueue: Message[] = [];
  private isProcessingQueue = false;
  private readonly QUEUE_BATCH_SIZE = 10;
  private readonly QUEUE_PROCESS_DELAY = 100;

  async connect(token?: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (this.socket?.connected) {
        resolve(true);
        return;
      }

      console.log('🔌 Connecting to WebSocket server...');
      
      // Get fresh token if not provided or expired
      let authToken = token;
      if (!authToken) {
        const refreshedToken = await AuthChatService.refreshTokenIfNeeded();
        if (!refreshedToken) {
          reject(new Error('No valid token available'));
          return;
        }
        authToken = refreshedToken;
      }
      
      // Optimized connection configuration
      this.socket = io('http://localhost:4000', {
        auth: {
          token: authToken
        },
        transports: ['websocket', 'polling'],
        timeout: 10000, // Reduced timeout
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: this.maxReconnectAttempts,
        // Performance optimizations
        upgrade: true,
        rememberUpgrade: true,
        autoConnect: true,
      });

      // Connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          console.error('❌ Connection timeout');
          reject(new Error('Connection timeout'));
        }
      }, 15000);

      // Connection success
      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected:', this.socket?.id);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        this.connectionHandlers.forEach(handler => handler(true));
        resolve(true);
      });

      // Connection error
      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        this.isConnected = false;
        this.connectionHandlers.forEach(handler => handler(false));
        
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        reject(error);
      });

      // Reconnection handling
      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.connectionHandlers.forEach(handler => handler(true));
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 WebSocket reconnection attempt ${attemptNumber}`);
        this.reconnectAttempts = attemptNumber;
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('❌ WebSocket reconnection error:', error);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('❌ WebSocket reconnection failed');
        this.isConnected = false;
        this.connectionHandlers.forEach(handler => handler(false));
      });

      // Disconnect
      this.socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
        this.isConnected = false;
        this.connectionHandlers.forEach(handler => handler(false));
        
        // Auto-reconnect if not manual disconnect
        if (reason !== 'io client disconnect') {
          this.handleReconnect(authToken);
        }
      });

      // Message handling with queue optimization
      this.socket.on('message:receive', (message: Message) => {
        this.addMessageToQueue(message);
      });

      this.socket.on('chat:new', (message: Message) => {
        this.addMessageToQueue(message);
      });

      this.socket.on('message:sent', (message: Message) => {
        this.addMessageToQueue(message);
      });

      // Room events
      this.socket.on('rooms:list', (rooms: Room[]) => {
        console.log('🏠 Received rooms:', rooms);
        this.roomHandlers.forEach(handler => handler(rooms));
      });

      this.socket.on('room:joined', (room: Room) => {
        console.log('🚪 Joined room:', room);
      });

      this.socket.on('room:left', (roomId: string) => {
        console.log('🚪 Left room:', roomId);
      });

      // Typing events
      this.socket.on('typing:start', (data: { roomId: string; user: string }) => {
        this.typingHandlers.forEach(handler => handler({ ...data, isTyping: true }));
      });

      this.socket.on('typing:stop', (data: { roomId: string; user: string }) => {
        this.typingHandlers.forEach(handler => handler({ ...data, isTyping: false }));
      });

      // Error handling
      this.socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });

      // Timeout for connection
      setTimeout(() => {
        if (!this.isConnected) {
          console.error('❌ Connection timeout');
          reject(new Error('Connection timeout'));
        }
      }, 10000); // Reduced from 20s to 10s
    });
  }

  // Optimized message queue processing
  private addMessageToQueue(message: Message): void {
    this.messageQueue.push(message);
    
    if (!this.isProcessingQueue) {
      this.processMessageQueue();
    }
  }

  private async processMessageQueue(): Promise<void> {
    if (this.isProcessingQueue || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.messageQueue.length > 0) {
      const batch = this.messageQueue.splice(0, this.QUEUE_BATCH_SIZE);
      
      // Process batch
      batch.forEach(message => {
        this.messageHandlers.forEach(handler => handler(message));
      });

      // Small delay to prevent blocking
      if (this.messageQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.QUEUE_PROCESS_DELAY));
      }
    }

    this.isProcessingQueue = false;
  }

  private handleReconnect(token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Auto-reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        this.connect(token);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      
      // Clear message queue
      this.messageQueue = [];
      this.isProcessingQueue = false;
      
      // Clear timeouts
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      // Clear handlers
      this.messageHandlers = [];
      this.roomHandlers = [];
      this.connectionHandlers = [];
      this.typingHandlers = [];
    }
  }

  // Room management
  joinRoom(roomId: string) {
    if (this.socket?.connected) {
      console.log('🚪 Joining room:', roomId);
      this.socket.emit('room:join', { roomId });
    }
  }

  leaveRoom(roomId: string) {
    if (this.socket?.connected) {
      console.log('🚪 Leaving room:', roomId);
      this.socket.emit('room:leave', { roomId });
    }
  }

  // Message sending
  sendMessage(roomId: string, content: string, type: 'text' | 'image' | 'file' = 'text') {
    if (this.socket?.connected) {
      const message: Omit<Message, 'id' | 'timestamp'> = {
        content,
        senderId: this.getCurrentUserId(),
        senderName: this.getCurrentUserName(),
        senderRole: this.getCurrentUserRole(),
        roomId,
        type
      };

      console.log('📤 Sending message:', message);
      this.socket.emit('message:send', message);
    } else {
      console.error('❌ Cannot send message: Socket not connected');
    }
  }

  // Typing indicators
  startTyping(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing:start', { roomId });
    }
  }

  stopTyping(roomId: string) {
    if (this.socket?.connected) {
      this.socket.emit('typing:stop', { roomId });
    }
  }

  // Event listeners
  onMessage(handler: (message: Message) => void) {
    this.messageHandlers.push(handler);
  }

  onRooms(handler: (rooms: Room[]) => void) {
    this.roomHandlers.push(handler);
  }

  onConnection(handler: (connected: boolean) => void) {
    this.connectionHandlers.push(handler);
  }

  onTyping(handler: (data: { roomId: string; user: string; isTyping: boolean }) => void) {
    this.typingHandlers.push(handler);
  }

  // Utility methods
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  private getCurrentUserId(): string {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    return user.id?.toString() || 'unknown';
  }

  private getCurrentUserName(): string {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    return user.name || 'Unknown User';
  }

  private getCurrentUserRole(): string {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    return user.role || 'Customer';
  }

  // Request rooms list
  requestRooms() {
    if (this.socket?.connected) {
      console.log('📋 Requesting rooms list...');
      this.socket.emit('rooms:request');
    }
  }
}

export default new SocketService();
export type { Message, Room };