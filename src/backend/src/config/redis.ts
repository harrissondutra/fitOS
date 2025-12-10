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

    // Verificar se é localhost e não conectar nesse caso
    if (config.redis.url.includes('localhost') && config.redis.host === 'localhost') {
      logger.warn('⚠️ Redis URL is localhost, but you mentioned Redis is remote. Please update REDIS_URL in .env');
      return;
    }

    // Usar URL completa ou host/port separados
    let redisConfig: any;
    
    if (config.redis.url && !config.redis.url.includes('localhost')) {
      // Usar URL completa para Redis remoto
      logger.info(`🔗 Connecting to remote Redis: ${config.redis.url.replace(/:[^:]*@/, ':****@')}`);
      redisConfig = {
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          if (times > 3) {
            logger.error('❌ Redis max retries reached');
            return null; // Stop retrying
          }
          return delay;
        },
        reconnectOnError: (err: Error) => {
          const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
          const shouldReconnect = targetErrors.some(e => err.message.includes(e));
          if (shouldReconnect) {
            logger.warn('⚠️ Redis reconnection needed:', err.message);
            return true;
          }
          return false;
        },
        lazyConnect: true
      };
      redis = new Redis(config.redis.url, redisConfig);
    } else {
      // Usar configuração separada
      logger.info(`🔗 Connecting to Redis: ${config.redis.host}:${config.redis.port}`);
      redisConfig = {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          if (times > 3) {
            logger.error('❌ Redis max retries reached');
            return null; // Stop retrying
          }
          return delay;
        },
        reconnectOnError: (err: Error) => {
          const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
          const shouldReconnect = targetErrors.some(e => err.message.includes(e));
          if (shouldReconnect) {
            logger.warn('⚠️ Redis reconnection needed:', err.message);
            return true;
          }
          return false;
        },
        lazyConnect: true
      };
      redis = new Redis(redisConfig);
    }

    redis.on('connect', () => {
      logger.info('✅ Redis connected');
    });

    redis.on('ready', () => {
      logger.info('✅ Redis ready');
    });

    // Tratamento completo de erros do Redis
    redis.on('error', (error: Error) => {
      const errorMessage = error.message || String(error);
      
      // ECONNRESET, ETIMEDOUT são erros de rede comuns - apenas logar como warning
      if (errorMessage.includes('ECONNRESET') || errorMessage.includes('ETIMEDOUT') || errorMessage.includes('ECONNREFUSED')) {
        logger.warn(`⚠️ Redis network error (will retry): ${errorMessage}`);
        return;
      }
      
      // Outros erros - logar como erro mas não lançar
      logger.error('❌ Redis connection error:', error);
    });

    redis.on('close', () => {
      logger.warn('⚠️ Redis connection closed - will attempt to reconnect');
    });

    redis.on('end', () => {
      logger.warn('⚠️ Redis connection ended - will attempt to reconnect');
    });

    redis.on('reconnecting', (delay: number) => {
      logger.info(`🔄 Redis reconnecting in ${delay}ms`);
    });

    // Conectar ao Redis
    await redis.connect();
    
    // Test connection with timeout
    try {
      const pingPromise = redis.ping();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis ping timeout')), 10000)
      );
      
      await Promise.race([pingPromise, timeoutPromise]);
      logger.info('✅ Redis ping successful');
    } catch (error) {
      logger.warn('⚠️ Redis ping failed, but continuing:', error);
      // Não lançar erro - permitir que continue sem Redis
    }
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
      disconnect: async () => {},
      connect: async () => {},
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
  
  // Garantir que o Redis sempre tenha tratamento de erro
  // Verificar se já tem listener de erro, se não tiver, adicionar
  const errorListeners = (redis as any).listenerCount?.('error') || 0;
  if (errorListeners === 0) {
    redis.on('error', (error: Error) => {
      const errorMessage = error.message || String(error);
      if (errorMessage.includes('ECONNRESET') || errorMessage.includes('ETIMEDOUT') || errorMessage.includes('ECONNREFUSED')) {
        logger.warn(`⚠️ Redis network error (will retry): ${errorMessage}`);
      } else {
        logger.error('❌ Redis error:', error);
      }
    });
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
