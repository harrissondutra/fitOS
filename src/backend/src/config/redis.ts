import Redis from 'ioredis';
import { config } from './config-simple';
import { logger } from '../utils/logger';

let redis: Redis;

export const connectRedis = async (): Promise<void> => {
  try {
    // Verificar se Redis está configurado
    if (!config.redis.url) {
      logger.warn('⚠️ Redis URL not configured. Skipping Redis connection.');
      return;
    }

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
    logger.warn('⚠️ Continuing without Redis. Some features will be disabled.');
    // Não lançar erro para permitir que a aplicação continue sem Redis
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
    logger.warn('Redis not available, returning mock client');
    // Retornar um cliente mock que não faz nada
    return {
      get: async () => null,
      set: async () => 'OK',
      setex: async () => 'OK',
      del: async () => 0,
      ping: async () => 'PONG',
      info: async () => '',
      on: () => {},
      quit: async () => 'OK',
      status: 'ready',
      pipeline: () => {
        const commands: any[] = [];
        return {
          incr: (key: string) => {
            commands.push(['incr', key, 1]);
            return { exec: async () => [1] };
          },
          expire: (key: string, ttl: number) => {
            commands.push(['expire', key, ttl]);
            return { exec: async () => [1] };
          },
          exec: async () => {
            return commands.map(() => [null, 1]);
          }
        };
      },
      incr: async () => 1,
      expire: async () => 1,
      exists: async () => 0,
      keys: async () => [],
      flushall: async () => 'OK',
      flushdb: async () => 'OK',
      publish: async () => 0,
      subscribe: async () => {},
      unsubscribe: async () => {}
    } as any;
  }
  return redis;
};

// Cache utilities
export const cache = {
  async get(key: string): Promise<string | null> {
    const client = getRedisClient();
    return await client.get(key);
  },

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const client = getRedisClient();
    if (ttl) {
      await client.setex(key, ttl, value);
    } else {
      await client.set(key, value);
    }
  },

  async del(key: string): Promise<void> {
    const client = getRedisClient();
    await client.del(key);
  },

  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    const result = await client.exists(key);
    return result === 1;
  },

  async flush(): Promise<void> {
    const client = getRedisClient();
    await client.flushdb();
  },
};
