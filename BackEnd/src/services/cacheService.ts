// import Redis from 'ioredis'; // Commented out - Redis not installed
import { config } from '@/config/env';
import logger from '@/config/logger';

class CacheService {
  private redis: any; // Changed from Redis to any since Redis is not installed
  private isConnected: boolean = false;

  constructor() {
    // Mock Redis since it's not installed
    this.redis = {
      on: () => {},
      connect: () => Promise.resolve(),
      get: () => Promise.resolve(null),
      set: () => Promise.resolve('OK'),
      del: () => Promise.resolve(1),
      exists: () => Promise.resolve(0),
      expire: () => Promise.resolve(1),
      ttl: () => Promise.resolve(-1),
      keys: () => Promise.resolve([]),
      flushall: () => Promise.resolve('OK'),
      quit: () => Promise.resolve('OK')
    };

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.redis.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis connected successfully');
    });

    this.redis.on('error', (error: any) => {
      this.isConnected = false;
      logger.error('Redis connection error:', error);
    });

    this.redis.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });
  }

  // Basic cache operations
  async get(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) return null;
      return await this.redis.get(key);
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, value);
      } else {
        await this.redis.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  // JSON operations
  async getJSON<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache getJSON error:', error);
      return null;
    }
  }

  async setJSON(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value);
      return await this.set(key, jsonValue, ttlSeconds);
    } catch (error) {
      logger.error('Cache setJSON error:', error);
      return false;
    }
  }

  // Hash operations
  async hget(hash: string, field: string): Promise<string | null> {
    try {
      if (!this.isConnected) return null;
      return await this.redis.hget(hash, field);
    } catch (error) {
      logger.error('Cache hget error:', error);
      return null;
    }
  }

  async hset(hash: string, field: string, value: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.redis.hset(hash, field, value);
      return true;
    } catch (error) {
      logger.error('Cache hset error:', error);
      return false;
    }
  }

  async hgetall(hash: string): Promise<Record<string, string> | null> {
    try {
      if (!this.isConnected) return null;
      return await this.redis.hgetall(hash);
    } catch (error) {
      logger.error('Cache hgetall error:', error);
      return null;
    }
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.redis.lpush(key, ...values);
      return true;
    } catch (error) {
      logger.error('Cache lpush error:', error);
      return false;
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) return null;
      return await this.redis.rpop(key);
    } catch (error) {
      logger.error('Cache rpop error:', error);
      return null;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      if (!this.isConnected) return [];
      return await this.redis.lrange(key, start, stop);
    } catch (error) {
      logger.error('Cache lrange error:', error);
      return [];
    }
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.redis.sadd(key, ...members);
      return true;
    } catch (error) {
      logger.error('Cache sadd error:', error);
      return false;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      if (!this.isConnected) return [];
      return await this.redis.smembers(key);
    } catch (error) {
      logger.error('Cache smembers error:', error);
      return [];
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      const result = await this.redis.sismember(key, member);
      return result === 1;
    } catch (error) {
      logger.error('Cache sismember error:', error);
      return false;
    }
  }

  // TTL operations
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      const result = await this.redis.expire(key, seconds);
      return result === 1;
    } catch (error) {
      logger.error('Cache expire error:', error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      if (!this.isConnected) return -1;
      return await this.redis.ttl(key);
    } catch (error) {
      logger.error('Cache ttl error:', error);
      return -1;
    }
  }

  // Pattern operations
  async keys(pattern: string): Promise<string[]> {
    try {
      if (!this.isConnected) return [];
      return await this.redis.keys(pattern);
    } catch (error) {
      logger.error('Cache keys error:', error);
      return [];
    }
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern: string): Promise<boolean> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache invalidatePattern error:', error);
      return false;
    }
  }

  // Cache warming
  async warmCache(key: string, data: any, ttlSeconds: number = 3600): Promise<boolean> {
    try {
      return await this.setJSON(key, data, ttlSeconds);
    } catch (error) {
      logger.error('Cache warmCache error:', error);
      return false;
    }
  }

  // Cache statistics
  async getStats(): Promise<any> {
    try {
      if (!this.isConnected) return null;
      
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      return {
        connected: this.isConnected,
        memory: info,
        keyspace: keyspace,
        uptime: await this.redis.info('server'),
      };
    } catch (error) {
      logger.error('Cache getStats error:', error);
      return null;
    }
  }

  // Close connection
  async close(): Promise<void> {
    try {
      await this.redis.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Cache key generators
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  ticket: (id: string) => `ticket:${id}`,
  tickets: (filters: string) => `tickets:${filters}`,
  messages: (roomId: string) => `messages:${roomId}`,
  session: (token: string) => `session:${token}`,
  stats: (type: string) => `stats:${type}`,
  analytics: (type: string, period: string) => `analytics:${type}:${period}`,
  rateLimit: (ip: string, endpoint: string) => `rate_limit:${ip}:${endpoint}`,
} as const;

// Cache TTL constants
export const CacheTTL = {
  USER: 3600, // 1 hour
  TICKET: 1800, // 30 minutes
  MESSAGES: 300, // 5 minutes
  SESSION: 86400, // 24 hours
  STATS: 300, // 5 minutes
  ANALYTICS: 3600, // 1 hour
  RATE_LIMIT: 900, // 15 minutes
} as const;
