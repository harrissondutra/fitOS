import { getRedisClient } from './redis';

export class CacheService {
  private client = getRedisClient();
  private readonly prefix = 'fitos:';

  async get<T>(namespace: string, key: string): Promise<T | null> {
    try {
      const fullKey = `${this.prefix}${namespace}:${key}`;
      const cached = await this.client.get(fullKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(namespace: string, key: string, value: any, ttl?: number): Promise<void> {
    try {
      const fullKey = `${this.prefix}${namespace}:${key}`;
      if (ttl) {
        await this.client.setex(fullKey, ttl, JSON.stringify(value));
      } else {
        await this.client.set(fullKey, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(namespace: string, key: string): Promise<void> {
    try {
      const fullKey = `${this.prefix}${namespace}:${key}`;
      await this.client.del(fullKey);
    } catch (error) {
      console.error('Cache del error:', error);
    }
  }

  async delByPattern(namespace: string, pattern: string): Promise<void> {
    try {
      const fullPattern = `${this.prefix}${namespace}:${pattern}`;
      const keys = await this.client.keys(fullPattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Cache delByPattern error:', error);
    }
  }
}
