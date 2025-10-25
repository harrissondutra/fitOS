/**
 * Redis Service - FitOS
 * 
 * Serviço centralizado para operações Redis com:
 * - Cache Manager com TTL configurável
 * - Key patterns com namespace por tenant
 * - Serialização JSON automática
 * - Error handling com graceful degradation
 * - Cache invalidation por padrão
 * - Statistics de hit/miss ratio
 */

import Redis from 'ioredis';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

export interface CacheOptions {
  ttl?: number; // TTL em segundos
  namespace?: string; // Namespace para a chave
  serialize?: boolean; // Se deve serializar/deserializar JSON
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRatio: number;
}

export class RedisService {
  private redis: Redis | null = null;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    hitRatio: 0
  };

  constructor() {
    // Não inicializar Redis aqui - será feito lazy loading
  }

  private getRedis(): Redis {
    if (!this.redis) {
      try {
        this.redis = getRedisClient();
        this.setupEventHandlers();
      } catch (error) {
        logger.warn('Redis not available, operations will be skipped:', error);
        // Retornar um cliente mock que não faz nada
        return this.createMockRedisClient();
      }
    }
    return this.redis;
  }

  private createMockRedisClient(): Redis {
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

  private setupEventHandlers(): void {
    if (this.redis) {
      this.redis.on('error', (error) => {
        logger.error('Redis error:', error);
        this.stats.errors++;
      });

      this.redis.on('connect', () => {
        logger.info('Redis service connected');
      });
    }
  }

  /**
   * Gera chave de cache com namespace e tenant
   */
  private generateKey(key: string, options: CacheOptions = {}): string {
    const { namespace, ttl } = options;
    const prefix = process.env.REDIS_KEY_PREFIX || 'fitos:';
    
    let fullKey = prefix;
    
    if (namespace) {
      fullKey += `${namespace}:`;
    }
    
    fullKey += key;
    
    return fullKey;
  }

  /**
   * Serializa valor para armazenamento
   */
  private serialize(value: any, options: CacheOptions): string {
    if (options.serialize === false) {
      return String(value);
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    try {
      return JSON.stringify(value);
    } catch (error) {
      logger.error('Error serializing value:', error);
      return String(value);
    }
  }

  /**
   * Deserializa valor do armazenamento
   */
  private deserialize(value: string, options: CacheOptions): any {
    if (options.serialize === false) {
      return value;
    }
    
    try {
      return JSON.parse(value);
    } catch (error) {
      // Se não conseguir fazer parse, retorna como string
      return value;
    }
  }

  /**
   * Obtém valor do cache
   */
  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(key, options);
      const value = await this.getRedis().get(cacheKey);
      
      if (value === null) {
        this.stats.misses++;
        return null;
      }
      
      this.stats.hits++;
      this.updateHitRatio();
      
      return this.deserialize(value, options);
    } catch (error) {
      logger.error('Redis GET error:', error);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Define valor no cache
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key, options);
      const serializedValue = this.serialize(value, options);
      
      if (options.ttl) {
        await this.getRedis().setex(cacheKey, options.ttl, serializedValue);
      } else {
        await this.getRedis().set(cacheKey, serializedValue);
      }
      
      this.stats.sets++;
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Remove valor do cache
   */
  async del(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key, options);
      const result = await this.getRedis().del(cacheKey);
      
      this.stats.deletes++;
      return result > 0;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Verifica se chave existe
   */
  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key, options);
      const result = await this.getRedis().exists(cacheKey);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Define TTL para uma chave
   */
  async expire(key: string, ttl: number, options: CacheOptions = {}): Promise<boolean> {
    try {
      const cacheKey = this.generateKey(key, options);
      const result = await this.getRedis().expire(cacheKey, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXPIRE error:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Obtém TTL de uma chave
   */
  async ttl(key: string, options: CacheOptions = {}): Promise<number> {
    try {
      const cacheKey = this.generateKey(key, options);
      return await this.getRedis().ttl(cacheKey);
    } catch (error) {
      logger.error('Redis TTL error:', error);
      this.stats.errors++;
      return -1;
    }
  }

  /**
   * Invalida chaves por padrão (wildcard)
   */
  async invalidatePattern(pattern: string, options: CacheOptions = {}): Promise<number> {
    try {
      const searchPattern = this.generateKey(pattern, options);
      const keys = await this.getRedis().keys(searchPattern);
      
      if (keys.length === 0) {
        return 0;
      }
      
      const result = await this.getRedis().del(...keys);
      this.stats.deletes += result;
      return result;
    } catch (error) {
      logger.error('Redis INVALIDATE PATTERN error:', error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Invalida cache por tenant
   */
  async invalidateTenant(tenantId: string, namespace?: string): Promise<number> {
    const pattern = namespace ? `tenant:${tenantId}:${namespace}:*` : `tenant:${tenantId}:*`;
    return this.invalidatePattern(pattern);
  }

  /**
   * Obtém múltiplas chaves
   */
  async mget(keys: string[], options: CacheOptions = {}): Promise<(any | null)[]> {
    try {
      const cacheKeys = keys.map(key => this.generateKey(key, options));
      const values = await this.getRedis().mget(...cacheKeys);
      
      return values.map((value, index) => {
        if (value === null) {
          this.stats.misses++;
          return null;
        }
        
        this.stats.hits++;
        return this.deserialize(value, options);
      });
    } catch (error) {
      logger.error('Redis MGET error:', error);
      this.stats.errors++;
      return keys.map(() => null);
    } finally {
      this.updateHitRatio();
    }
  }

  /**
   * Define múltiplas chaves
   */
  async mset(keyValuePairs: Record<string, any>, options: CacheOptions = {}): Promise<boolean> {
    try {
      const pipeline = this.getRedis().pipeline();
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const cacheKey = this.generateKey(key, options);
        const serializedValue = this.serialize(value, options);
        
        if (options.ttl) {
          pipeline.setex(cacheKey, options.ttl, serializedValue);
        } else {
          pipeline.set(cacheKey, serializedValue);
        }
      }
      
      await pipeline.exec();
      this.stats.sets += Object.keys(keyValuePairs).length;
      return true;
    } catch (error) {
      logger.error('Redis MSET error:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Incrementa contador
   */
  async incr(key: string, options: CacheOptions = {}): Promise<number> {
    try {
      const cacheKey = this.generateKey(key, options);
      return await this.getRedis().incr(cacheKey);
    } catch (error) {
      logger.error('Redis INCR error:', error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Incrementa contador com TTL
   */
  async incrWithTTL(key: string, ttl: number, options: CacheOptions = {}): Promise<number> {
    try {
      const cacheKey = this.generateKey(key, options);
      const pipeline = this.getRedis().pipeline();
      
      pipeline.incr(cacheKey);
      pipeline.expire(cacheKey, ttl);
      
      const results = await pipeline.exec();
      return results?.[0]?.[1] as number || 0;
    } catch (error) {
      logger.error('Redis INCR WITH TTL error:', error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Lista chaves por padrão
   */
  async keys(pattern: string, options: CacheOptions = {}): Promise<string[]> {
    try {
      const searchPattern = this.generateKey(pattern, options);
      return await this.getRedis().keys(searchPattern);
    } catch (error) {
      logger.error('Redis KEYS error:', error);
      this.stats.errors++;
      return [];
    }
  }

  /**
   * Flush database
   */
  async flush(): Promise<boolean> {
    try {
      await this.getRedis().flushdb();
      this.resetStats();
      return true;
    } catch (error) {
      logger.error('Redis FLUSH error:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reseta estatísticas
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRatio: 0
    };
  }

  /**
   * Atualiza hit ratio
   */
  private updateHitRatio(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRatio = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Health check do Redis
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number; error?: string }> {
    try {
      const start = Date.now();
      await this.getRedis().ping();
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Obter cliente Redis
   */
  getClient(): Redis {
    return this.getRedis();
  }

  /**
   * Obter subscriber Redis (mesmo cliente para simplificar)
   */
  getSubscriber(): Redis {
    return this.getRedis();
  }

  /**
   * Obtém informações do Redis
   */
  async getInfo(): Promise<Record<string, any>> {
    try {
      const info = await this.getRedis().info();
      const lines = info.split('\r\n');
      const result: Record<string, any> = {};
      
      for (const line of lines) {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          result[key] = isNaN(Number(value)) ? value : Number(value);
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Redis INFO error:', error);
      return {};
    }
  }
}

// Instância singleton
export const redisService = new RedisService();
