// Mock InMemoryCache - Not actually used
export class InMemoryCache {
  private static instance: InMemoryCache;
  
  static getInstance(): InMemoryCache {
    if (!InMemoryCache.instance) {
      InMemoryCache.instance = new InMemoryCache();
    }
    return InMemoryCache.instance;
  }
  
  getStats() {
    return { size: 0, hits: 0, misses: 0 };
  }
  
  async cacheMessage(roomId: string, messageId: string, message: any) {}
  async publishMessage(roomId: string, message: any) {}
  async set(key: string, value: any, ttl?: number) {}
  async get(key: string) { return null; }
  async setTyping(roomId: string, userId: string, isTyping: boolean) {}
}
