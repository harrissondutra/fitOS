/**
 * Queue Service - FitOS
 * 
 * Sistema de filas usando Bull + Redis:
 * - Email queue
 * - AI queue
 * - Analytics queue
 * - Notification queue
 * - Report queue
 */

import Queue from 'bull';
import { redisService } from './redis.service';
import { logger } from '../utils/logger';
import { config } from '../config/config-simple';

export interface JobData {
  [key: string]: any;
}

export interface JobOptions {
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete?: number;
  removeOnFail?: number;
  priority?: number;
}

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export class QueueService {
  private queues: Map<string, Queue.Queue> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeQueues();
  }

  /**
   * Inicializar todas as filas
   */
  private initializeQueues(): void {
    try {
      // Email Queue
      this.createQueue('email', {
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      });

      // AI Queue
      this.createQueue('ai', {
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 5000
          }
        }
      });

      // Analytics Queue
      this.createQueue('analytics', {
        defaultJobOptions: {
          removeOnComplete: 200,
          removeOnFail: 100,
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 3000
          }
        }
      });

      // Notification Queue
      this.createQueue('notification', {
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          }
        }
      });

      // Report Queue
      this.createQueue('report', {
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 10000
          }
        }
      });

      this.isInitialized = true;
      logger.info('✅ All queues initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize queues:', error);
    }
  }

  /**
   * Criar nova fila
   */
  private createQueue(name: string, options: any = {}): Queue.Queue {
    const queue = new Queue(name, {
      redis: {
        host: config.redis.host || 'localhost',
        port: config.redis.port || 6379,
        password: config.redis.password,
        db: config.redis.db || 0
      },
      ...options
    });

    // Event handlers
    queue.on('completed', (job) => {
      logger.debug(`Job completed: ${name}:${job.id}`);
    });

    queue.on('failed', (job, err) => {
      logger.error(`Job failed: ${name}:${job.id}`, err);
    });

    queue.on('stalled', (job) => {
      logger.warn(`Job stalled: ${name}:${job.id}`);
    });

    this.queues.set(name, queue);
    return queue;
  }

  /**
   * Adicionar job à fila
   */
  async addJob(queueName: string, jobType: string, data: JobData, options: JobOptions = {}): Promise<Queue.Job> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.add(jobType, data, options);
    logger.debug(`Job added to ${queueName}: ${jobType} (${job.id})`);
    return job;
  }

  /**
   * Processar jobs de email
   */
  async addEmailJob(data: {
    to: string | string[];
    subject: string;
    template: string;
    context?: any;
    attachments?: any[];
    tenantId?: string;
  }, options: JobOptions = {}): Promise<Queue.Job> {
    return this.addJob('email', 'send-email', data, {
      priority: 1,
      ...options
    });
  }

  /**
   * Processar jobs de AI
   */
  async addAIJob(data: {
    type: 'workout-generation' | 'exercise-recommendation' | 'progress-analysis';
    userId: string;
    tenantId: string;
    input: any;
    options?: any;
  }, options: JobOptions = {}): Promise<Queue.Job> {
    return this.addJob('ai', data.type, data, {
      priority: 2,
      ...options
    });
  }

  /**
   * Processar jobs de analytics
   */
  async addAnalyticsJob(data: {
    type: 'calculate-tenant' | 'calculate-trainer' | 'calculate-member' | 'calculate-global';
    tenantId?: string;
    userId?: string;
    period: string;
    forceRefresh?: boolean;
  }, options: JobOptions = {}): Promise<Queue.Job> {
    return this.addJob('analytics', data.type, data, {
      priority: 3,
      ...options
    });
  }

  /**
   * Processar jobs de notificação
   */
  async addNotificationJob(data: {
    type: 'push' | 'email' | 'sms' | 'in-app';
    userId: string;
    tenantId: string;
    title: string;
    message: string;
    data?: any;
    scheduledFor?: Date;
  }, options: JobOptions = {}): Promise<Queue.Job> {
    const jobOptions: JobOptions = {
      priority: 1,
      ...options
    };

    if (data.scheduledFor) {
      jobOptions.delay = data.scheduledFor.getTime() - Date.now();
    }

    return this.addJob('notification', data.type, data, jobOptions);
  }

  /**
   * Processar jobs de relatório
   */
  async addReportJob(data: {
    type: 'analytics' | 'workout' | 'client' | 'financial';
    tenantId: string;
    userId: string;
    format: 'pdf' | 'excel' | 'csv';
    filters: any;
    emailTo?: string;
  }, options: JobOptions = {}): Promise<Queue.Job> {
    return this.addJob('report', data.type, data, {
      priority: 4,
      ...options
    });
  }

  /**
   * Obter estatísticas de todas as filas
   */
  async getQueueStats(): Promise<QueueStats[]> {
    const stats: QueueStats[] = [];

    for (const [name, queue] of this.queues) {
      try {
        const counts = await queue.getJobCounts();
        const isPaused = await queue.isPaused();

        stats.push({
          name,
          waiting: counts.waiting,
          active: counts.active,
          completed: counts.completed,
          failed: counts.failed,
          delayed: counts.delayed,
          paused: isPaused
        });
      } catch (error) {
        logger.error(`Error getting stats for queue ${name}:`, error);
        stats.push({
          name,
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: false
        });
      }
    }

    return stats;
  }

  /**
   * Pausar fila
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
    logger.info(`Queue ${queueName} paused`);
  }

  /**
   * Retomar fila
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    logger.info(`Queue ${queueName} resumed`);
  }

  /**
   * Limpar fila
   */
  async cleanQueue(queueName: string, grace: number = 0): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.clean(grace);
    logger.info(`Queue ${queueName} cleaned`);
  }

  /**
   * Obter jobs de uma fila
   */
  async getQueueJobs(queueName: string, status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' = 'waiting'): Promise<Queue.Job[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const jobs = await queue.getJobs([status], 0, 100);
    return jobs;
  }

  /**
   * Remover job
   */
  async removeJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
      logger.info(`Job ${jobId} removed from queue ${queueName}`);
    }
  }

  /**
   * Reprocessar job falhado
   */
  async retryJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (job) {
      await job.retry();
      logger.info(`Job ${jobId} retried in queue ${queueName}`);
    }
  }

  /**
   * Obter fila por nome
   */
  getQueue(queueName: string): Queue.Queue | undefined {
    return this.queues.get(queueName);
  }

  /**
   * Verificar se fila existe
   */
  hasQueue(queueName: string): boolean {
    return this.queues.has(queueName);
  }

  /**
   * Obter lista de filas
   */
  getQueueNames(): string[] {
    return Array.from(this.queues.keys());
  }

  /**
   * Fechar todas as filas
   */
  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.queues.values()).map(queue => queue.close());
    await Promise.all(closePromises);
    this.queues.clear();
    this.isInitialized = false;
    logger.info('All queues closed');
  }

  /**
   * Verificar se serviço está inicializado
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Instância singleton
export const queueService = new QueueService();



