// ChatSocketManager - Stable Socket.IO wrapper with auto-reconnect
import { io, Socket } from 'socket.io-client';
import AuthChatService from './AuthChatService';

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'Customer' | 'Agent';
  content: string;
  timestamp: string;
  isRead: boolean;
  clientTempId?: string;
}

interface Conversation {
  id: string;
  customerId: string;
  shopId: string;
  orderId?: string;
  shopName: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  isActive: boolean;
}

interface SocketHealth {
  isConnected: boolean;
  lastPing: number;
  reconnectAttempts: number;
  rooms: string[];
}

class ChatSocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private joinedRooms = new Set<string>();
  private lastMessageAt: string | null = null;
  private messageHandlers = new Map<string, Function[]>();
  private typingHandlers = new Map<string, Function[]>();

  // Health status
  private health: SocketHealth = {
    isConnected: false,
    lastPing: 0,
    reconnectAttempts: 0,
    rooms: []
  };

  constructor() {
    this.setupHealthCheck();
  }

  // Initialize socket connection
  async connect(): Promise<boolean> {
    try {
      const token = await AuthChatService.getToken();
      if (!token) {
        console.error('❌ No token available for socket connection');
        return false;
      }

      console.log('🔄 ChatSocketManager: Connecting to server...', 'Token:', token.substring(0, 20) + '...');
      
      this.socket = io('http://localhost:4000', {
        auth: { token },
        transports: ['websocket'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      });

      this.setupEventHandlers();
      return true;
    } catch (error) {
      console.error('❌ ChatSocketManager: Connection failed:', error);
      return false;
    }
  }

  // Setup socket event handlers
  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ ChatSocketManager: Connected to server');
      this.health.isConnected = true;
      this.health.reconnectAttempts = 0;
      this.reconnectAttempts = 0;
      
      // Rejoin all previous rooms
      this.rejoinRooms();
      
      // Start ping/pong
      this.startPingPong();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('⚠️ ChatSocketManager: Disconnected:', reason);
      this.health.isConnected = false;
      this.stopPingPong();
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ ChatSocketManager: Connection error:', error);
      this.health.isConnected = false;
      this.handleReconnect();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ ChatSocketManager: Reconnected after ${attemptNumber} attempts`);
      this.health.isConnected = true;
      this.health.reconnectAttempts = attemptNumber;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ ChatSocketManager: Reconnect error:', error);
      this.handleReconnect();
    });

    this.socket.on('pong', () => {
      this.health.lastPing = Date.now();
    });

    // Chat events
    this.socket.on('receive_message', (data: ChatMessage) => {
      console.log('📨 ChatSocketManager: New message received:', data);
      this.emitToHandlers('message:new', data);
    });

    this.socket.on('chat:message:delivered', (data: { messageId: string, conversationId: string }) => {
      console.log('✅ ChatSocketManager: Message delivered:', data);
      this.emitToHandlers('message:delivered', data);
    });

    this.socket.on('chat:message:read', (data: { messageId: string, conversationId: string }) => {
      console.log('👁️ ChatSocketManager: Message read:', data);
      this.emitToHandlers('message:read', data);
    });

    this.socket.on('chat:typing', (data: { conversationId: string, userId: string, isTyping: boolean }) => {
      this.emitToHandlers('typing', data);
    });

    this.socket.on('chat:error', (error) => {
      console.error('❌ ChatSocketManager: Chat error:', error);
      this.emitToHandlers('error', error);
    });
  }

  // Join conversation room
  async joinConversation(conversationId: string): Promise<boolean> {
    if (!this.socket || !this.health.isConnected) {
      // console.error('❌ ChatSocketManager: Not connected, cannot join room');
      return false;
    }

    try {
      console.log(`🔄 ChatSocketManager: Joining conversation ${conversationId}`);
      
      this.socket.emit('join_room', { roomId: conversationId });
      this.joinedRooms.add(conversationId);
      this.health.rooms.push(conversationId);
      
      return true;
    } catch (error) {
      console.error('❌ ChatSocketManager: Failed to join conversation:', error);
      return false;
    }
  }

  // Leave conversation room
  async leaveConversation(conversationId: string): Promise<boolean> {
    if (!this.socket || !this.health.isConnected) {
      return false;
    }

    try {
      console.log(`🔄 ChatSocketManager: Leaving conversation ${conversationId}`);
      
      this.socket.emit('leave_room', { roomId: conversationId });
      this.joinedRooms.delete(conversationId);
      this.health.rooms = this.health.rooms.filter(room => room !== conversationId);
      
      return true;
    } catch (error) {
      console.error('❌ ChatSocketManager: Failed to leave conversation:', error);
      return false;
    }
  }

  // Send message with idempotency
  async sendMessage(conversationId: string, content: string): Promise<string | null> {
    if (!this.socket || !this.health.isConnected) {
      console.error('❌ ChatSocketManager: Not connected, cannot send message');
      return null;
    }

    const clientTempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`🔄 ChatSocketManager: Sending message to ${conversationId}`);
      
      this.socket.emit('send_message', {
        roomId: conversationId,
        content,
        type: 'text'
      });

      return clientTempId;
    } catch (error) {
      console.error('❌ ChatSocketManager: Failed to send message:', error);
      return null;
    }
  }

  // Send typing indicator
  async sendTyping(conversationId: string, isTyping: boolean): Promise<void> {
    if (!this.socket || !this.health.isConnected) {
      return;
    }

    try {
      this.socket.emit('chat:typing', {
        conversationId,
        isTyping
      });
    } catch (error) {
      console.error('❌ ChatSocketManager: Failed to send typing:', error);
    }
  }

  // Mark message as read
  async markAsRead(conversationId: string, messageId: string): Promise<void> {
    if (!this.socket || !this.health.isConnected) {
      return;
    }

    try {
      this.socket.emit('chat:message:read', {
        conversationId,
        messageId
      });
    } catch (error) {
      console.error('❌ ChatSocketManager: Failed to mark as read:', error);
    }
  }

  // Sync messages after reconnect
  async syncMessages(conversationId: string, since?: string): Promise<ChatMessage[]> {
    try {
      const token = await AuthChatService.getToken();
      const sinceParam = since || this.lastMessageAt || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const response = await fetch(`http://localhost:4000/api/messages/sync?conversationId=${conversationId}&since=${sinceParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.messages || [];
      }
      
      return [];
    } catch (error) {
      console.error('❌ ChatSocketManager: Failed to sync messages:', error);
      return [];
    }
  }

  // Event handlers management
  on(event: string, handler: Function): void {
    if (!this.messageHandlers.has(event)) {
      this.messageHandlers.set(event, []);
    }
    this.messageHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emitToHandlers(event: string, data: any): void {
    const handlers = this.messageHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ ChatSocketManager: Handler error for ${event}:`, error);
        }
      });
    }
  }

  // Rejoin all rooms after reconnect
  private rejoinRooms(): void {
    this.joinedRooms.forEach(roomId => {
      this.joinConversation(roomId);
    });
  }

  // Handle reconnection logic
  private handleReconnect(): void {
    this.reconnectAttempts++;
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      console.log(`🔄 ChatSocketManager: Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ ChatSocketManager: Max reconnection attempts reached');
    }
  }

  // Ping/pong for health check
  private startPingPong(): void {
    this.pingInterval = setInterval(() => {
      if (this.socket && this.health.isConnected) {
        this.socket.emit('ping');
      }
    }, 20000); // Every 20 seconds
  }

  private stopPingPong(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Health check setup
  private setupHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastPing = now - this.health.lastPing;
      
      if (timeSinceLastPing > 60000) { // 1 minute
        // console.warn('⚠️ ChatSocketManager: No ping response for 1 minute');
        if (this.health.isConnected) {
          this.socket?.disconnect();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  // Get health status
  getHealth(): SocketHealth {
    return { ...this.health };
  }

  // Disconnect and cleanup
  disconnect(): void {
    // console.log('🔄 ChatSocketManager: Disconnecting...');
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.health.isConnected = false;
    this.joinedRooms.clear();
    this.messageHandlers.clear();
    this.typingHandlers.clear();
  }
}

// Singleton instance
const chatSocketManager = new ChatSocketManager();
export default chatSocketManager;
