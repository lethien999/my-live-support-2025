// Enhanced Socket Service based on Graduation-Thesis architecture
import { io, Socket } from 'socket.io-client';

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

export default class EnhancedSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  // Event callbacks
  private onMessageCallback?: (message: ChatMessage) => void;
  private onTypingCallback?: (data: { roomId: string; users: TypingUser[] }) => void;
  private onOnlineStatusCallback?: (data: { roomId: string; users: OnlineStatus[] }) => void;
  private onRoomUpdateCallback?: (room: ChatRoom) => void;
  private onErrorCallback?: (error: string) => void;
  private onConnectCallback?: () => void;
  private onDisconnectCallback?: () => void;

  constructor() {
    this.setupEventListeners();
  }

  // Initialize connection with token
  async connect(token: string): Promise<boolean> {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return true;
    }

    this.isConnecting = true;
    this.token = token;

    try {
      this.socket = io('http://localhost:4000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      return new Promise((resolve) => {
        this.socket!.on('connect', () => {
          console.log('✅ Socket connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.onConnectCallback?.();
          resolve(true);
        });

        this.socket!.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
          this.isConnecting = false;
          this.onErrorCallback?.(`Connection failed: ${error.message}`);
          resolve(false);
        });

        this.socket!.on('disconnect', (reason) => {
          console.log('🔌 Socket disconnected:', reason);
          this.isConnecting = false;
          this.onDisconnectCallback?.();
          
          // Auto-reconnect if not intentional
          if (reason !== 'io client disconnect') {
            this.handleReconnect();
          }
        });
      });
    } catch (error) {
      console.error('❌ Socket initialization error:', error);
      this.isConnecting = false;
      return false;
    }
  }

  // Setup event listeners
  private setupEventListeners() {
    if (!this.socket) return;

    // Message events
    this.socket.on('message:receive', (message: ChatMessage) => {
      console.log('📨 Message received:', message);
      this.onMessageCallback?.(message);
    });

    // Typing events
    this.socket.on('typing', (data: { roomId: string; users: TypingUser[] }) => {
      console.log('⌨️ Typing status:', data);
      this.onTypingCallback?.(data);
    });

    // Online status events
    this.socket.on('online_status', (data: { roomId: string; users: OnlineStatus[] }) => {
      console.log('🟢 Online status:', data);
      this.onOnlineStatusCallback?.(data);
    });

    // Room events
    this.socket.on('room:updated', (room: ChatRoom) => {
      console.log('🏠 Room updated:', room);
      this.onRoomUpdateCallback?.(room);
    });

    // Error events
    this.socket.on('error', (error: { message: string }) => {
      console.error('❌ Socket error:', error);
      this.onErrorCallback?.(error.message);
    });
  }

  // Room management
  joinRoom(roomId: string): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket not connected, cannot join room');
      return;
    }

    console.log('🚪 Joining room:', roomId);
    this.socket.emit('chat:join', { roomId });
  }

  leaveRoom(roomId: string): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket not connected, cannot leave room');
      return;
    }

    console.log('🚪 Leaving room:', roomId);
    this.socket.emit('chat:leave', { roomId });
  }

  // Message handling
  sendMessage(roomId: string, content: string, type: 'text' | 'image' | 'file' = 'text', fileId?: string): void {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket not connected, cannot send message');
      return;
    }

    const messageData = {
      roomId,
      type,
      content,
      fileId
    };

    console.log('📤 Sending message:', messageData);
    this.socket.emit('message:send', messageData);
  }

  // Typing indicators
  setTyping(roomId: string, isTyping: boolean): void {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    this.socket.emit('typing', { roomId, isTyping });
  }

  // Event callbacks
  onMessage(callback: (message: ChatMessage) => void): void {
    this.onMessageCallback = callback;
  }

  onTyping(callback: (data: { roomId: string; users: TypingUser[] }) => void): void {
    this.onTypingCallback = callback;
  }

  onOnlineStatus(callback: (data: { roomId: string; users: OnlineStatus[] }) => void): void {
    this.onOnlineStatusCallback = callback;
  }

  onRoomUpdate(callback: (room: ChatRoom) => void): void {
    this.onRoomUpdateCallback = callback;
  }

  onError(callback: (error: string) => void): () => void {
    if (!this.socket) return () => {};
    
    this.socket.on('error', callback);
    return () => this.socket?.off('error', callback);
  }

  onConnect(callback: () => void): () => void {
    if (!this.socket) return () => {};
    
    this.socket.on('connect', callback);
    return () => this.socket?.off('connect', callback);
  }

  onDisconnect(callback: () => void): () => void {
    if (!this.socket) return () => {};
    
    this.socket.on('disconnect', callback);
    return () => this.socket?.off('disconnect', callback);
  }

  // Connection management
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket ? this.socket.connected : false;
  }

  // Reconnection handling
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.token) {
        this.connect(this.token);
      }
    }, delay);
  }

  // Utility methods
  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  // File upload support
  sendFile(roomId: string, file: File, _onProgress?: (progress: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      // Create file upload request
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', roomId);

      // Upload file to server
      fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Send file message
          this.sendMessage(roomId, data.fileUrl, 'file', data.fileId);
          resolve(data.fileId);
        } else {
          reject(new Error(data.error || 'File upload failed'));
        }
      })
      .catch(reject);
    });
  }

  // Send typing status
  sendTypingStatus(roomId: string, isTyping: boolean): void {
    if (!this.socket || !this.socket.connected) return;
    
    this.socket.emit('typing', {
      roomId,
      isTyping,
      timestamp: new Date().toISOString()
    });
  }

  // Mark message as read
  markMessageAsRead(roomId: string, messageId: string): void {
    if (!this.socket || !this.socket.connected) return;
    
    this.socket.emit('message:read', {
      roomId,
      messageId,
      timestamp: new Date().toISOString()
    });
  }

  // Event listeners for enhanced features
  onTypingStatus(callback: (status: { userId: string; userName: string; isTyping: boolean }) => void): () => void {
    if (!this.socket) return () => {};
    
    this.socket.on('typing', callback);
    return () => this.socket?.off('typing', callback);
  }


  onUploadProgress(callback: (progress: { fileId: string; progress: number; status: string; fileName?: string }) => void): () => void {
    if (!this.socket) return () => {};
    
    this.socket.on('upload_progress', callback);
    return () => this.socket?.off('upload_progress', callback);
  }
}

// Export singleton instance
export const EnhancedSocketServiceInstance = new EnhancedSocketService();
