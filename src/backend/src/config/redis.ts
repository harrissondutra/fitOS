import Redis from 'ioredis';
import { config } from './config';
import { logger } from '../utils/logger';

let redis: Redis;

export const connectRedis = async (): Promise<void> => {
  try {
    // Parse Redis URL properly
    const redisUrl = new URL(config.redis.url);
    
    redis = new Redis({
      host: redisUrl.hostname,
      port: parseInt(redisUrl.port || '6379', 10),
      password: redisUrl.password || config.redis.password,
      db: config.redis.db,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    redis.on('connect', () => {
      logger.info('✅ Redis connected');
    });

    redis.on('error', (error) => {
      logger.error('❌ Redis connection error:', error);
    });

    redis.on('close', () => {
      logger.warn('⚠️ Redis connection closed');
    });

    // Test connection
    await redis.ping();
    logger.info('✅ Redis ping successful');
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    throw error;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redis?.disconnect();
    logger.info('✅ Redis disconnected');
  } catch (error) {
    logger.error('❌ Redis disconnection failed:', error);
    throw error;
  }
};

export const getRedisClient = (): Redis => {
  if (!redis) {
    throw new Error('Redis not connected. Call connectRedis() first.');
  }
  return redis;
};

// Cache utilities
export const cache = {
  async get(key: string): Promise<string | null> {
    return await redis.get(key);
  },

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await redis.setex(key, ttl, value);
    } else {
      await redis.set(key, value);
    }
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async exists(key: string): Promise<boolean> {
    const result = await redis.exists(key);
    return result === 1;
  },

  async flush(): Promise<void> {
    await redis.flushdb();
  },
};
