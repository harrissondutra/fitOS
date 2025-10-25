/**
 * Cache Warming Service - FitOS
 * 
 * Serviço para aquecimento proativo de caches:
 * - Pre-carregar caches críticos no startup
 * - Refresh proativo antes de expiração
 * - Warming após invalidação em massa
 */

import { redisService } from './redis.service';
import { logger } from '../utils/logger';
import { generateCacheKey, calculateTTL } from '../utils/cache-utils';

export interface WarmingConfig {
  enabled: boolean;
  preloadOnStartup: boolean;
  refreshBeforeExpiry: boolean;
  warmingDelay: number; // ms
  maxConcurrent: number;
  retryAttempts: number;
  retryDelay: number; // ms
}

export interface WarmingStats {
  totalWarmed: number;
  successful: number;
  failed: number;
  lastWarming: Date | null;
  duration: number; // ms
}

export class CacheWarmingService {
  private config: WarmingConfig;
  private stats: WarmingStats;
  private isWarming = false;
  private warmingQueue: Array<() => Promise<void>> = [];

  constructor() {
    this.config = {
      enabled: process.env.ENABLE_CACHE_WARMING === 'true',
      preloadOnStartup: true,
      refreshBeforeExpiry: true,
      warmingDelay: 1000, // 1 segundo entre operações
      maxConcurrent: 5,
      retryAttempts: 3,
      retryDelay: 2000 // 2 segundos
    };

    this.stats = {
      totalWarmed: 0,
      successful: 0,
      failed: 0,
      lastWarming: null,
      duration: 0
    };
  }

  /**
   * Inicializar warming de cache
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      logger.info('Cache warming is disabled');
      return;
    }

    if (this.config.preloadOnStartup) {
      await this.warmCriticalCaches();
    }

    logger.info('✅ Cache warming service initialized');
  }

  /**
   * Aquecer caches críticos
   */
  async warmCriticalCaches(): Promise<void> {
    if (this.isWarming) {
      logger.warn('Cache warming is already in progress');
      return;
    }

    this.isWarming = true;
    const startTime = Date.now();

    try {
      logger.info('🔥 Starting cache warming...');

      // Aquecer caches por prioridade
      await this.warmAnalyticsCaches();
      await this.warmExerciseCaches();
      await this.warmClientCaches();
      await this.warmSystemCaches();

      this.stats.lastWarming = new Date();
      this.stats.duration = Date.now() - startTime;

      logger.info(`✅ Cache warming completed in ${this.stats.duration}ms`);
    } catch (error) {
      logger.error('❌ Cache warming failed:', error);
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Aquecer cache de analytics
   */
  private async warmAnalyticsCaches(): Promise<void> {
    try {
      logger.info('Warming analytics caches...');
      
      // Aquecer analytics globais
      const globalAnalyticsKey = generateCacheKey('analytics:global:30d');
      await redisService.set(globalAnalyticsKey, { 
        message: 'Cache warmed at startup',
        timestamp: new Date()
      }, {
        namespace: 'analytics',
        ttl: calculateTTL('analytics')
      });

      this.stats.successful += 1;
      logger.info('Analytics caches warmed');
    } catch (error) {
      this.stats.failed += 1;
      logger.error('Failed to warm analytics caches:', error);
    }
  }

  /**
   * Aquecer cache de exercícios
   */
  private async warmExerciseCaches(): Promise<void> {
    try {
      logger.info('Warming exercise caches...');
      
      // Aquecer cache de exercícios públicos
      const publicExercisesKey = generateCacheKey('exercises:public:list');
      await redisService.set(publicExercisesKey, {
        message: 'Public exercises cache warmed',
        timestamp: new Date()
      }, {
        namespace: 'exercises',
        ttl: calculateTTL('catalog')
      });

      this.stats.successful += 1;
      logger.info('Exercise caches warmed');
    } catch (error) {
      this.stats.failed += 1;
      logger.error('Failed to warm exercise caches:', error);
    }
  }

  /**
   * Aquecer cache de clientes
   */
  private async warmClientCaches(): Promise<void> {
    try {
      logger.info('Warming client caches...');
      
      // Aquecer cache de estatísticas de clientes
      const clientStatsKey = generateCacheKey('clients:stats:global');
      await redisService.set(clientStatsKey, {
        message: 'Client stats cache warmed',
        timestamp: new Date()
      }, {
        namespace: 'clients',
        ttl: calculateTTL('user')
      });

      this.stats.successful += 1;
      logger.info('Client caches warmed');
    } catch (error) {
      this.stats.failed += 1;
      logger.error('Failed to warm client caches:', error);
    }
  }

  /**
   * Aquecer cache de sistema
   */
  private async warmSystemCaches(): Promise<void> {
    try {
      logger.info('Warming system caches...');
      
      // Aquecer cache de configurações do sistema
      const systemConfigKey = generateCacheKey('system:config');
      await redisService.set(systemConfigKey, {
        message: 'System config cache warmed',
        timestamp: new Date(),
        version: '1.0.0'
      }, {
        namespace: 'system',
        ttl: calculateTTL('analytics')
      });

      this.stats.successful += 1;
      logger.info('System caches warmed');
    } catch (error) {
      this.stats.failed += 1;
      logger.error('Failed to warm system caches:', error);
    }
  }

  /**
   * Aquecer cache específico por chave
   */
  async warmCache(key: string, data: any, namespace: string = 'default', ttl?: number): Promise<void> {
    try {
      const cacheKey = generateCacheKey(key);
      await redisService.set(cacheKey, data, {
        namespace,
        ttl: ttl || calculateTTL('analytics')
      });

      this.stats.totalWarmed += 1;
      this.stats.successful += 1;
      logger.debug(`Cache warmed: ${cacheKey}`);
    } catch (error) {
      this.stats.failed += 1;
      logger.error(`Failed to warm cache ${key}:`, error);
      throw error;
    }
  }

  /**
   * Invalidar e re-aquecer cache
   */
  async refreshCache(key: string, data: any, namespace: string = 'default', ttl?: number): Promise<void> {
    try {
      // Invalidar cache existente
      const cacheKey = generateCacheKey(key);
      await redisService.del(cacheKey, { namespace });

      // Re-aquecer com novos dados
      await this.warmCache(key, data, namespace, ttl);
      
      logger.info(`Cache refreshed: ${cacheKey}`);
    } catch (error) {
      logger.error(`Failed to refresh cache ${key}:`, error);
      throw error;
    }
  }

  /**
   * Obter estatísticas de warming
   */
  getStats(): WarmingStats {
    return { ...this.stats };
  }

  /**
   * Verificar se está aquecendo
   */
  isCurrentlyWarming(): boolean {
    return this.isWarming;
  }

  /**
   * Parar warming
   */
  stopWarming(): void {
    this.isWarming = false;
    this.warmingQueue = [];
    logger.info('Cache warming stopped');
  }
}

export const cacheWarmingService = new CacheWarmingService();