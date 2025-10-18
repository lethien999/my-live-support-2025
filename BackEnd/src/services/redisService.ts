// src/services/redisService.ts
import { createClient, RedisClientType } from 'redis';
import { config } from '../config/env';

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            const maxRetries = parseInt(process.env.REDIS_MAX_RETRIES || '3', 10);
            const retryDelay = parseInt(process.env.REDIS_RETRY_DELAY || '1000', 10);
            
            if (retries > maxRetries) {
              console.log('❌ Redis max retries exceeded, giving up');
              return new Error('Max retries exceeded');
            }
            
            console.log(`🔄 Redis reconnecting... attempt ${retries}/${maxRetries}`);
            return Math.min(retries * retryDelay, 5000);
          }
        }
      });

      this.client.on('error', (err) => {
        // Only log error once to avoid spam
        if (!this.isConnected) {
          console.error('❌ Redis Client Error:', err.message);
        }
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('🔌 Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('🔌 Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
      this.isConnected = false;
    }
  }

  private ensureConnected(): void {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
  }

  // Real-time messaging methods
  async publishMessage(roomId: string, message: any): Promise<void> {
    this.ensureConnected();
    await this.client!.publish(`chat:${roomId}`, JSON.stringify(message));
  }

  async subscribeToRoom(roomId: string, callback: (message: any) => void): Promise<void> {
    this.ensureConnected();
    await this.client!.subscribe(`chat:${roomId}`, (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        callback(parsedMessage);
      } catch (error) {
        console.error('❌ Error parsing Redis message:', error);
      }
    });
  }

  // Caching methods
  async cacheMessage(roomId: string, messageId: string, message: any): Promise<void> {
    this.ensureConnected();
    await this.client!.setEx(`message:${roomId}:${messageId}`, 3600, JSON.stringify(message));
  }

  async getCachedMessage(roomId: string, messageId: string): Promise<any | null> {
    this.ensureConnected();
    const cached = await this.client!.get(`message:${roomId}:${messageId}`);
    return cached ? JSON.parse(cached) : null;
  }

  // Room management
  async addUserToRoom(roomId: string, userId: string): Promise<void> {
    this.ensureConnected();
    await this.client!.sAdd(`room:${roomId}:users`, userId);
  }

  async removeUserFromRoom(roomId: string, userId: string): Promise<void> {
    this.ensureConnected();
    await this.client!.sRem(`room:${roomId}:users`, userId);
  }

  async getRoomUsers(roomId: string): Promise<string[]> {
    this.ensureConnected();
    return await this.client!.sMembers(`room:${roomId}:users`);
  }

  // Typing indicators
  async setTyping(roomId: string, userId: string, isTyping: boolean): Promise<void> {
    this.ensureConnected();
    if (isTyping) {
      await this.client!.sAdd(`room:${roomId}:typing`, userId);
      // Auto-expire after 10 seconds
      await this.client!.expire(`room:${roomId}:typing`, 10);
    } else {
      await this.client!.sRem(`room:${roomId}:typing`, userId);
    }
  }

  async getTypingUsers(roomId: string): Promise<string[]> {
    this.ensureConnected();
    return await this.client!.sMembers(`room:${roomId}:typing`);
  }

  // Health check
  async ping(): Promise<string> {
    this.ensureConnected();
    return await this.client!.ping();
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }
}

export const redisService = new RedisService();
