// src/services/inMemoryCache.ts - Redis alternative using in-memory cache
export class InMemoryCache {
  private static instance: InMemoryCache;
  private cache = new Map<string, any>();
  private messageQueues = new Map<string, any[]>();
  private roomUsers = new Map<string, Set<string>>();
  private typingUsers = new Map<string, Set<string>>();
  private messageSubscribers = new Map<string, Set<(message: any) => void>>();

  static getInstance(): InMemoryCache {
    if (!InMemoryCache.instance) {
      InMemoryCache.instance = new InMemoryCache();
    }
    return InMemoryCache.instance;
  }

  // Basic cache methods (Redis-like)
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiresAt });
    console.log(`💾 Cache set: ${key} (expires in ${ttlSeconds}s)`);
  }

  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      console.log(`⏰ Cache expired: ${key}`);
      return null;
    }
    
    return entry.value;
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    console.log(`🗑️ Cache deleted: ${key}`);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Real-time messaging methods (Redis Pub/Sub alternative)
  async publishMessage(roomId: string, message: any): Promise<void> {
    console.log(`📢 Publishing message to room ${roomId}:`, message);
    
    // Store in message queue
    if (!this.messageQueues.has(roomId)) {
      this.messageQueues.set(roomId, []);
    }
    this.messageQueues.get(roomId)!.push(message);
    
    // Notify subscribers
    const subscribers = this.messageSubscribers.get(roomId);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('❌ Error in message callback:', error);
        }
      });
    }
  }

  async subscribeToRoom(roomId: string, callback: (message: any) => void): Promise<void> {
    console.log(`📡 Subscribing to room ${roomId}`);
    
    if (!this.messageSubscribers.has(roomId)) {
      this.messageSubscribers.set(roomId, new Set());
    }
    this.messageSubscribers.get(roomId)!.add(callback);
  }

  async unsubscribeFromRoom(roomId: string, callback: (message: any) => void): Promise<void> {
    const subscribers = this.messageSubscribers.get(roomId);
    if (subscribers) {
      subscribers.delete(callback);
    }
  }

  // Caching methods
  async cacheMessage(roomId: string, messageId: string, message: any): Promise<void> {
    const key = `message:${roomId}:${messageId}`;
    this.cache.set(key, {
      data: message,
      timestamp: Date.now(),
      ttl: 3600000 // 1 hour
    });
  }

  async getCachedMessage(roomId: string, messageId: string): Promise<any | null> {
    const key = `message:${roomId}:${messageId}`;
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check TTL
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  // Room management
  async addUserToRoom(roomId: string, userId: string): Promise<void> {
    if (!this.roomUsers.has(roomId)) {
      this.roomUsers.set(roomId, new Set());
    }
    this.roomUsers.get(roomId)!.add(userId);
    console.log(`👤 User ${userId} added to room ${roomId}`);
  }

  async removeUserFromRoom(roomId: string, userId: string): Promise<void> {
    const users = this.roomUsers.get(roomId);
    if (users) {
      users.delete(userId);
      console.log(`👤 User ${userId} removed from room ${roomId}`);
    }
  }

  async getRoomUsers(roomId: string): Promise<string[]> {
    const users = this.roomUsers.get(roomId);
    return users ? Array.from(users) : [];
  }

  // Typing indicators
  async setTyping(roomId: string, userId: string, isTyping: boolean): Promise<void> {
    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Set());
    }
    
    const typingSet = this.typingUsers.get(roomId)!;
    
    if (isTyping) {
      typingSet.add(userId);
      // Auto-remove after 10 seconds
      setTimeout(() => {
        typingSet.delete(userId);
      }, 10000);
    } else {
      typingSet.delete(userId);
    }
    
    console.log(`⌨️ User ${userId} ${isTyping ? 'started' : 'stopped'} typing in room ${roomId}`);
  }

  async getTypingUsers(roomId: string): Promise<string[]> {
    const typingSet = this.typingUsers.get(roomId);
    return typingSet ? Array.from(typingSet) : [];
  }

  // Health check
  async ping(): Promise<string> {
    return 'PONG';
  }

  isReady(): boolean {
    return true; // Always ready for in-memory cache
  }

  // Cleanup expired data
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.ttl && now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache stats
  getStats(): any {
    return {
      cacheSize: this.cache.size,
      messageQueues: this.messageQueues.size,
      roomUsers: this.roomUsers.size,
      typingUsers: this.typingUsers.size,
      subscribers: this.messageSubscribers.size
    };
  }
}

export const inMemoryCache = InMemoryCache.getInstance();
