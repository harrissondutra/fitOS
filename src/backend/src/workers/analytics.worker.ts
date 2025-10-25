/**
 * Analytics Worker - FitOS
 * 
 * Worker para processamento de jobs de analytics:
 * - Cálculo de analytics de tenant
 * - Cálculo de analytics de trainer
 * - Cálculo de analytics de member
 * - Cálculo de analytics globais
 */

import { Job } from 'bull';
import { queueService } from '../services/queue.service';
import { logger } from '../utils/logger';
import { redisService } from '../services/redis.service';
import { generateAnalyticsCacheKey } from '../utils/cache-utils';

export interface AnalyticsJobData {
  type: 'calculate-tenant' | 'calculate-trainer' | 'calculate-member' | 'calculate-global';
  tenantId?: string;
  trainerId?: string;
  memberId?: string;
  period?: string;
}

export class AnalyticsWorker {
  private queue = queueService.getQueue('analytics');

  constructor() {
    this.setupProcessors();
  }

  /**
   * Configurar processadores de jobs
   */
  private setupProcessors(): void {
    if (!this.queue) {
      logger.error('Analytics queue not found');
      return;
    }

    // Processar cálculo de analytics de tenant
    this.queue.process('calculate-tenant', 3, async (job: Job<AnalyticsJobData>) => {
      return this.processTenantAnalytics(job);
    });

    // Processar cálculo de analytics de trainer
    this.queue.process('calculate-trainer', 3, async (job: Job<AnalyticsJobData>) => {
      return this.processTrainerAnalytics(job);
    });

    // Processar cálculo de analytics de member
    this.queue.process('calculate-member', 3, async (job: Job<AnalyticsJobData>) => {
      return this.processMemberAnalytics(job);
    });

    // Processar cálculo de analytics globais
    this.queue.process('calculate-global', 1, async (job: Job<AnalyticsJobData>) => {
      return this.processGlobalAnalytics(job);
    });

    logger.info('✅ Analytics worker processors configured');
  }

  /**
   * Processar analytics de tenant
   */
  private async processTenantAnalytics(job: Job<AnalyticsJobData>): Promise<any> {
    const { tenantId, period = '30d' } = job.data;
    
    if (!tenantId) {
      throw new Error('Tenant ID is required for tenant analytics');
    }

    try {
      logger.info(`Processing tenant analytics for ${tenantId}, period ${period}`);
      
      // Simular processamento de analytics
      const analyticsData = {
        tenantId,
        period,
        totalWorkouts: Math.floor(Math.random() * 1000),
        totalClients: Math.floor(Math.random() * 100),
        totalRevenue: Math.floor(Math.random() * 50000),
        processedAt: new Date()
      };

      // Salvar no cache
      const cacheKey = generateAnalyticsCacheKey('tenant', tenantId, period);
      await redisService.set(cacheKey, analyticsData, {
        namespace: 'analytics',
        ttl: 3600 // 1 hora
      });

      logger.info(`Tenant analytics processed for ${tenantId}`);
      return analyticsData;
    } catch (error) {
      logger.error(`Failed to process tenant analytics for ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Processar analytics de trainer
   */
  private async processTrainerAnalytics(job: Job<AnalyticsJobData>): Promise<any> {
    const { trainerId, tenantId, period = '30d' } = job.data;
    
    if (!trainerId || !tenantId) {
      throw new Error('Trainer ID and Tenant ID are required for trainer analytics');
    }

    try {
      logger.info(`Processing trainer analytics for ${trainerId}, tenant ${tenantId}, period ${period}`);
      
      // Simular processamento de analytics
      const analyticsData = {
        trainerId,
        tenantId,
        period,
        totalWorkouts: Math.floor(Math.random() * 500),
        totalClients: Math.floor(Math.random() * 50),
        totalHours: Math.floor(Math.random() * 200),
        processedAt: new Date()
      };

      // Salvar no cache
      const cacheKey = generateAnalyticsCacheKey('trainer', trainerId, period, tenantId);
      await redisService.set(cacheKey, analyticsData, {
        namespace: 'analytics',
        ttl: 3600 // 1 hora
      });

      logger.info(`Trainer analytics processed for ${trainerId}`);
      return analyticsData;
    } catch (error) {
      logger.error(`Failed to process trainer analytics for ${trainerId}:`, error);
      throw error;
    }
  }

  /**
   * Processar analytics de member
   */
  private async processMemberAnalytics(job: Job<AnalyticsJobData>): Promise<any> {
    const { memberId, tenantId, period = '30d' } = job.data;
    
    if (!memberId || !tenantId) {
      throw new Error('Member ID and Tenant ID are required for member analytics');
    }

    try {
      logger.info(`Processing member analytics for ${memberId}, tenant ${tenantId}, period ${period}`);
      
      // Simular processamento de analytics
      const analyticsData = {
        memberId,
        tenantId,
        period,
        totalWorkouts: Math.floor(Math.random() * 100),
        totalHours: Math.floor(Math.random() * 50),
        progressScore: Math.floor(Math.random() * 100),
        processedAt: new Date()
      };

      // Salvar no cache
      const cacheKey = generateAnalyticsCacheKey('member', memberId, period, tenantId);
      await redisService.set(cacheKey, analyticsData, {
        namespace: 'analytics',
        ttl: 3600 // 1 hora
      });

      logger.info(`Member analytics processed for ${memberId}`);
      return analyticsData;
    } catch (error) {
      logger.error(`Failed to process member analytics for ${memberId}:`, error);
      throw error;
    }
  }

  /**
   * Processar analytics globais
   */
  private async processGlobalAnalytics(job: Job<AnalyticsJobData>): Promise<any> {
    const { period = '30d' } = job.data;

    try {
      logger.info(`Processing global analytics, period ${period}`);
      
      // Simular processamento de analytics globais
      const analyticsData = {
        period,
        totalTenants: Math.floor(Math.random() * 1000),
        totalUsers: Math.floor(Math.random() * 10000),
        totalWorkouts: Math.floor(Math.random() * 50000),
        totalRevenue: Math.floor(Math.random() * 1000000),
        processedAt: new Date()
      };

      // Salvar no cache
      const cacheKey = generateAnalyticsCacheKey('global', 'global', period);
      await redisService.set(cacheKey, analyticsData, {
        namespace: 'analytics',
        ttl: 3600 // 1 hora
      });

      logger.info('Global analytics processed');
      return analyticsData;
    } catch (error) {
      logger.error('Failed to process global analytics:', error);
      throw error;
    }
  }

  /**
   * Adicionar job de analytics
   */
  async addAnalyticsJob(data: AnalyticsJobData, options?: any): Promise<Job | undefined> {
    if (!this.queue) {
      logger.error('Analytics queue not found');
      return;
    }

    return this.queue.add(data.type, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
      ...options
    });
  }

  /**
   * Obter estatísticas da fila
   */
  async getQueueStats(): Promise<any> {
    if (!this.queue) {
      return null;
    }

    const waiting = await this.queue.getWaiting();
    const active = await this.queue.getActive();
    const completed = await this.queue.getCompleted();
    const failed = await this.queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length
    };
  }
}

export const analyticsWorker = new AnalyticsWorker();