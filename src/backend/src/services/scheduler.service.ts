/**
 * Scheduler Service - FitOS
 * 
 * Serviço para agendamento de jobs usando Bull Queue:
 * - Limpeza de cache expirado
 * - Cálculo de analytics
 * - Envio de lembretes
 * - Verificação de churn
 * - Backup de sessões
 */

import { queueService } from './queue.service';
import { logger } from '../utils/logger';
import { redisService } from './redis.service';
import { sessionService } from './session.service';
import { presenceService } from './presence.service';
import { costSyncJobs } from './cost-sync-jobs.service';

export interface ScheduledJob {
  id: string;
  name: string;
  cron: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  data?: any;
}

export class SchedulerService {
  private jobs: Map<string, ScheduledJob> = new Map();
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private isRunning = false;

  constructor() {
    this.initializeJobs();
  }

  /**
   * Inicializar jobs agendados
   */
  private initializeJobs(): void {
    // Limpeza de cache expirado (diário às 2h)
    this.addJob('cache-cleanup', {
      id: 'cache-cleanup',
      name: 'Cache Cleanup',
      cron: '0 2 * * *', // 2:00 AM daily
      enabled: true,
      data: { type: 'cache-cleanup' }
    });

    // Cálculo de analytics (diário às 2h30)
    this.addJob('analytics-calculation', {
      id: 'analytics-calculation',
      name: 'Analytics Calculation',
      cron: '30 2 * * *', // 2:30 AM daily
      enabled: true,
      data: { type: 'analytics-calculation' }
    });

    // Envio de lembretes de agendamentos (a cada hora)
    this.addJob('appointment-reminders', {
      id: 'appointment-reminders',
      name: 'Appointment Reminders',
      cron: '0 * * * *', // Every hour
      enabled: true,
      data: { type: 'appointment-reminders' }
    });

    // Verificação de churn (semanal aos domingos às 3h)
    this.addJob('churn-detection', {
      id: 'churn-detection',
      name: 'Churn Detection',
      cron: '0 3 * * 0', // 3:00 AM on Sundays
      enabled: true,
      data: { type: 'churn-detection' }
    });

    // Backup de sessões ativas (a cada 6 horas)
    this.addJob('session-backup', {
      id: 'session-backup',
      name: 'Session Backup',
      cron: '0 */6 * * *', // Every 6 hours
      enabled: true,
      data: { type: 'session-backup' }
    });

    // Limpeza de presenças expiradas (a cada 15 minutos)
    this.addJob('presence-cleanup', {
      id: 'presence-cleanup',
      name: 'Presence Cleanup',
      cron: '*/15 * * * *', // Every 15 minutes
      enabled: true,
      data: { type: 'presence-cleanup' }
    });

    // Relatório de performance (semanal às segundas às 4h)
    this.addJob('performance-report', {
      id: 'performance-report',
      name: 'Performance Report',
      cron: '0 4 * * 1', // 4:00 AM on Mondays
      enabled: true,
      data: { type: 'performance-report' }
    });

    // Sincronização diária de custos de storage (Cloudinary) - às 3h
    this.addJob('cost-sync-storage', {
      id: 'cost-sync-storage',
      name: 'Daily Storage Costs Sync',
      cron: '0 3 * * *', // 3:00 AM daily
      enabled: true,
      data: { type: 'cost-sync-storage' }
    });

    // Sincronização mensal de custos de database - primeiro dia do mês às 4h
    this.addJob('cost-sync-database', {
      id: 'cost-sync-database',
      name: 'Monthly Database Costs Sync',
      cron: '0 4 1 * *', // 4:00 AM on the 1st of every month
      enabled: true,
      data: { type: 'cost-sync-database' }
    });

    logger.info('✅ Scheduler service initialized with scheduled jobs');
  }

  /**
   * Adicionar job agendado
   */
  addJob(id: string, job: ScheduledJob): void {
    this.jobs.set(id, job);
    logger.debug(`Scheduled job added: ${job.name}`);
  }

  /**
   * Iniciar scheduler
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    this.scheduleAllJobs();
    logger.info('✅ Scheduler started');
  }

  /**
   * Parar scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      logger.warn('Scheduler is not running');
      return;
    }

    this.isRunning = false;
    this.clearAllIntervals();
    logger.info('✅ Scheduler stopped');
  }

  /**
   * Agendar todos os jobs
   */
  private scheduleAllJobs(): void {
    for (const [id, job] of this.jobs) {
      if (job.enabled) {
        this.scheduleJob(id, job);
      }
    }
  }

  /**
   * Agendar job específico
   */
  private scheduleJob(id: string, job: ScheduledJob): void {
    try {
      const interval = this.cronToInterval(job.cron);
      
      if (interval > 0) {
        const timeout = setInterval(() => {
          this.executeJob(id, job);
        }, interval);

        this.intervals.set(id, timeout);
        
        // Calcular próxima execução
        job.nextRun = new Date(Date.now() + interval);
        
        logger.debug(`Job scheduled: ${job.name} (${job.cron})`);
      } else {
        logger.warn(`Invalid cron expression for job ${id}: ${job.cron}`);
      }
    } catch (error) {
      logger.error(`Error scheduling job ${id}:`, error);
    }
  }

  /**
   * Executar job
   */
  private async executeJob(id: string, job: ScheduledJob): Promise<void> {
    try {
      logger.info(`Executing scheduled job: ${job.name}`);
      
      job.lastRun = new Date();
      
      switch (job.data.type) {
        case 'cache-cleanup':
          await this.executeCacheCleanup();
          break;
        case 'analytics-calculation':
          await this.executeAnalyticsCalculation();
          break;
        case 'appointment-reminders':
          await this.executeAppointmentReminders();
          break;
        case 'churn-detection':
          await this.executeChurnDetection();
          break;
        case 'session-backup':
          await this.executeSessionBackup();
          break;
        case 'presence-cleanup':
          await this.executePresenceCleanup();
          break;
        case 'performance-report':
          await this.executePerformanceReport();
          break;
        case 'cost-sync-storage':
          await this.executeCostSyncStorage();
          break;
        case 'cost-sync-database':
          await this.executeCostSyncDatabase();
          break;
        default:
          logger.warn(`Unknown job type: ${job.data.type}`);
      }

      logger.info(`Scheduled job completed: ${job.name}`);
    } catch (error) {
      logger.error(`Error executing scheduled job ${job.name}:`, error);
    }
  }

  /**
   * Executar limpeza de cache
   */
  private async executeCacheCleanup(): Promise<void> {
    try {
      // Limpar cache expirado
      const keys = await redisService.keys('*');
      let cleanedCount = 0;

      for (const key of keys) {
        const ttl = await redisService.ttl(key);
        if (ttl === -1) { // Chave sem TTL
          await redisService.del(key);
          cleanedCount++;
        }
      }

      logger.info(`Cache cleanup completed: ${cleanedCount} keys removed`);
    } catch (error) {
      logger.error('Error during cache cleanup:', error);
    }
  }

  /**
   * Executar cálculo de analytics
   */
  private async executeAnalyticsCalculation(): Promise<void> {
    try {
      // Adicionar jobs de analytics para todos os tenants
      // Aqui você implementaria a lógica para buscar todos os tenants
      // e adicionar jobs de cálculo de analytics
      
      logger.info('Analytics calculation jobs added to queue');
    } catch (error) {
      logger.error('Error during analytics calculation:', error);
    }
  }

  /**
   * Executar lembretes de agendamentos
   */
  private async executeAppointmentReminders(): Promise<void> {
    try {
      // Adicionar jobs de lembretes de agendamentos
      // Aqui você implementaria a lógica para buscar agendamentos
      // que precisam de lembretes
      
      logger.info('Appointment reminder jobs added to queue');
    } catch (error) {
      logger.error('Error during appointment reminders:', error);
    }
  }

  /**
   * Executar detecção de churn
   */
  private async executeChurnDetection(): Promise<void> {
    try {
      // Adicionar jobs de detecção de churn
      // Aqui você implementaria a lógica para detectar usuários
      // que podem estar abandonando o serviço
      
      logger.info('Churn detection jobs added to queue');
    } catch (error) {
      logger.error('Error during churn detection:', error);
    }
  }

  /**
   * Executar backup de sessões
   */
  private async executeSessionBackup(): Promise<void> {
    try {
      // Fazer backup das sessões ativas
      const stats = await sessionService.getSessionStats();
      
      // Salvar estatísticas no Redis
      await redisService.set('backup:sessions', {
        timestamp: new Date(),
        stats
      }, {
        namespace: 'backup',
        ttl: 7 * 24 * 3600 // 7 dias
      });

      logger.info('Session backup completed');
    } catch (error) {
      logger.error('Error during session backup:', error);
    }
  }

  /**
   * Executar limpeza de presenças
   */
  private async executePresenceCleanup(): Promise<void> {
    try {
      const cleanedCount = await presenceService.cleanupExpiredPresence();
      logger.info(`Presence cleanup completed: ${cleanedCount} records cleaned`);
    } catch (error) {
      logger.error('Error during presence cleanup:', error);
    }
  }

  /**
   * Executar relatório de performance
   */
  private async executePerformanceReport(): Promise<void> {
    try {
      // Adicionar job de relatório de performance
      await queueService.addReportJob({
        type: 'analytics',
        tenantId: 'global',
        userId: 'system',
        format: 'pdf',
        filters: { period: 'weekly' }
      });

      logger.info('Performance report job added to queue');
    } catch (error) {
      logger.error('Error during performance report:', error);
    }
  }

  /**
   * Executar sincronização diária de custos de storage
   */
  private async executeCostSyncStorage(): Promise<void> {
    try {
      await costSyncJobs.syncDailyStorageCosts();
      logger.info('Daily storage costs sync completed');
    } catch (error) {
      logger.error('Error during storage costs sync:', error);
    }
  }

  /**
   * Executar sincronização mensal de custos de database
   */
  private async executeCostSyncDatabase(): Promise<void> {
    try {
      await costSyncJobs.syncMonthlyDatabaseCosts();
      logger.info('Monthly database costs sync completed');
    } catch (error) {
      logger.error('Error during database costs sync:', error);
    }
  }

  /**
   * Converter cron para intervalo em ms
   */
  private cronToInterval(cron: string): number {
    // Implementação simplificada - em produção use uma biblioteca como node-cron
    const parts = cron.split(' ');
    
    if (parts.length !== 5) {
      logger.warn(`Invalid cron expression: ${cron} - expected 5 parts`);
      return 0;
    }

    const [minute, hour, day, month, weekday] = parts;

    try {
      // Caso 1: */X * * * * - A cada X minutos
      if (minute.startsWith('*/') && hour === '*') {
        const interval = parseInt(minute.substring(2));
        if (isNaN(interval) || interval <= 0) {
          logger.warn(`Invalid cron expression: ${cron} - invalid minute interval`);
          return 0;
        }
        return interval * 60 * 1000; // X minutos em ms
      }

      // Caso 2: 0 */X * * * - A cada X horas
      if (minute === '0' && hour.startsWith('*/')) {
        const interval = parseInt(hour.substring(2));
        if (isNaN(interval) || interval <= 0) {
          logger.warn(`Invalid cron expression: ${cron} - invalid hour interval`);
          return 0;
        }
        return interval * 60 * 60 * 1000; // X horas em ms
      }

      // Caso 3: 0 * * * * - A cada hora
      if (minute === '0' && hour === '*') {
        return 60 * 60 * 1000; // 1 hora
      }

      // Caso 4: * * * * * - A cada minuto
      if (minute === '*' && hour === '*') {
        return 60 * 1000; // 1 minuto
      }

      // Caso 5: 0 X * * * - Horário específico
      if (minute === '0' && !hour.includes('*') && !hour.includes('/')) {
        const h = parseInt(hour);
        if (isNaN(h)) {
          logger.warn(`Invalid cron expression: ${cron} - invalid hour`);
          return 0;
        }
        
        const now = new Date();
        const next = new Date();
        next.setHours(h, 0, 0, 0);
        
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        
        return next.getTime() - now.getTime();
      }

      // Caso 6: X * * * * - Minuto específico a cada hora
      if (!minute.includes('*') && !minute.includes('/') && hour === '*') {
        const m = parseInt(minute);
        if (isNaN(m) || m < 0 || m > 59) {
          logger.warn(`Invalid cron expression: ${cron} - invalid minute`);
          return 0;
        }
        
        const now = new Date();
        const next = new Date();
        next.setMinutes(m, 0, 0);
        
        if (next <= now) {
          next.setHours(next.getHours() + 1);
        }
        
        return next.getTime() - now.getTime();
      }

          // Caso 7: X Y * * * - Horário específico todos os dias
          if (!minute.includes('*') && !minute.includes('/') && !hour.includes('*') && !hour.includes('/') && 
              day === '*' && month === '*' && weekday === '*') {
            const m = parseInt(minute);
            const h = parseInt(hour);
            if (isNaN(m) || isNaN(h) || m < 0 || m > 59 || h < 0 || h > 23) {
              logger.warn(`Invalid cron expression: ${cron} - invalid minute or hour`);
              return 0;
            }
            
            const now = new Date();
            const next = new Date();
            next.setHours(h, m, 0, 0);
            
            if (next <= now) {
              next.setDate(next.getDate() + 1);
            }
            
            return next.getTime() - now.getTime();
          }

          // Caso 8: 0 X * * Y - Dia da semana específico
          if (minute === '0' && !hour.includes('*') && !hour.includes('/') && !weekday.includes('*')) {
            const h = parseInt(hour);
            const w = parseInt(weekday);
            if (isNaN(h) || isNaN(w)) {
              logger.warn(`Invalid cron expression: ${cron} - invalid hour or weekday`);
              return 0;
            }
            
            const now = new Date();
            const next = new Date();
            next.setHours(h, 0, 0, 0);
            
            // Calcular próximo dia da semana
            const daysUntilTarget = (w - now.getDay() + 7) % 7;
            if (daysUntilTarget === 0 && next <= now) {
              next.setDate(next.getDate() + 7);
            } else {
              next.setDate(next.getDate() + daysUntilTarget);
            }
            
            return next.getTime() - now.getTime();
          }

      logger.warn(`Unsupported cron expression: ${cron}`);
      return 0;
    } catch (error) {
      logger.warn(`Error parsing cron expression: ${cron}`, error);
      return 0;
    }
  }

  /**
   * Limpar todos os intervalos
   */
  private clearAllIntervals(): void {
    for (const [id, interval] of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }

  /**
   * Habilitar/desabilitar job
   */
  toggleJob(id: string, enabled: boolean): void {
    const job = this.jobs.get(id);
    if (!job) {
      throw new Error(`Job ${id} not found`);
    }

    job.enabled = enabled;

    if (enabled) {
      this.scheduleJob(id, job);
    } else {
      const interval = this.intervals.get(id);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(id);
      }
    }

    logger.info(`Job ${id} ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Obter status de todos os jobs
   */
  getJobsStatus(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Obter status de um job específico
   */
  getJobStatus(id: string): ScheduledJob | undefined {
    return this.jobs.get(id);
  }

  /**
   * Executar job manualmente
   */
  async executeJobManually(id: string): Promise<void> {
    const job = this.jobs.get(id);
    if (!job) {
      throw new Error(`Job ${id} not found`);
    }

    await this.executeJob(id, job);
  }

  /**
   * Verificar se scheduler está rodando
   */
  isSchedulerRunning(): boolean {
    return this.isRunning;
  }
}

// Instância singleton
export const schedulerService = new SchedulerService();
