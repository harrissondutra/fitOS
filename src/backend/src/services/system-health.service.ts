/**
 * System Health Service - FitOS
 * 
 * Service para monitoramento de saúde do sistema com cache Redis
 */

import { redisService } from './redis.service';
import { logger } from '../utils/logger';
import { 
  SystemHealthOverview, 
  ServiceStatus, 
  SystemAlert, 
  SystemMetrics, 
  PerformanceHistory,
  CacheMetrics 
} from '../../../shared/types/system-health';

export class SystemHealthService {
  private alerts: SystemAlert[] = [];
  private metricsHistory: SystemMetrics[] = [];

  constructor() {
    // Inicializar com dados mock
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock alerts
    this.alerts = [
      {
        id: '1',
        type: 'warning',
        message: 'High CPU usage detected',
        service: 'CPU',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        resolved: false
      },
      {
        id: '2',
        type: 'info',
        message: 'Scheduled maintenance completed',
        service: 'System',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        resolved: true
      }
    ];

    // Mock metrics history (últimas 24 horas)
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      this.metricsHistory.push({
        timestamp,
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        networkIn: Math.random() * 1000,
        networkOut: Math.random() * 1000
      });
    }
  }

  async getSystemHealthOverview(): Promise<SystemHealthOverview> {
    const cacheKey = 'admin:system-health:overview';
    const cached = await redisService.get<SystemHealthOverview>(cacheKey);
    if (cached) {
      logger.info('System health overview served from cache');
      return cached;
    }

    logger.info('Computing system health overview');
    const data = await this.computeHealthOverview();
    
    await redisService.set(cacheKey, data, { 
      ttl: parseInt(process.env.CACHE_TTL_SYSTEM_HEALTH_OVERVIEW || '30')
    });
    
    return data;
  }

  async getServicesStatus(): Promise<ServiceStatus[]> {
    const cacheKey = 'admin:system-health:services';
    const cached = await redisService.get<ServiceStatus[]>(cacheKey);
    if (cached) {
      logger.info('Services status served from cache');
      return cached;
    }

    logger.info('Computing services status');
    const data = await this.computeServicesStatus();
    
    await redisService.set(cacheKey, data, { 
      ttl: parseInt(process.env.CACHE_TTL_SYSTEM_HEALTH_SERVICES || '60')
    });
    
    return data;
  }

  async getSystemMetrics(period: '1h' | '24h' | '7d' | '30d'): Promise<SystemMetrics[]> {
    const cacheKey = `admin:system-health:metrics:${period}`;
    const cached = await redisService.get<SystemMetrics[]>(cacheKey);
    if (cached) {
      logger.info(`System metrics for ${period} served from cache`);
      return cached;
    }

    logger.info(`Computing system metrics for ${period}`);
    const data = await this.computeSystemMetrics(period);
    
    await redisService.set(cacheKey, data, { 
      ttl: parseInt(process.env.CACHE_TTL_SYSTEM_HEALTH_METRICS || '300')
    });
    
    return data;
  }

  async getActiveAlerts(): Promise<SystemAlert[]> {
    const cacheKey = 'admin:system-health:alerts';
    const cached = await redisService.get<SystemAlert[]>(cacheKey);
    if (cached) {
      logger.info('Active alerts served from cache');
      return cached;
    }

    logger.info('Computing active alerts');
    const data = this.alerts.filter(alert => !alert.resolved);
    
    await redisService.set(cacheKey, data, { 
      ttl: parseInt(process.env.CACHE_TTL_SYSTEM_HEALTH_ALERTS || '10')
    });
    
    return data;
  }

  async getPerformanceHistory(range: '24h' | '7d' | '30d'): Promise<PerformanceHistory> {
    const cacheKey = `admin:system-health:history:${range}`;
    const cached = await redisService.get<PerformanceHistory>(cacheKey);
    if (cached) {
      logger.info(`Performance history for ${range} served from cache`);
      return cached;
    }

    logger.info(`Computing performance history for ${range}`);
    const data = await this.computePerformanceHistory(range);
    
    await redisService.set(cacheKey, data, { 
      ttl: parseInt(process.env.CACHE_TTL_SYSTEM_HEALTH_HISTORY || '3600')
    });
    
    return data;
  }

  async getCacheMetrics(): Promise<CacheMetrics> {
    const stats = await redisService.getStats();
    const info = await redisService.getInfo();
    
    return {
      hits: stats.hits,
      misses: stats.misses,
      hitRatio: stats.hitRatio,
      memoryUsed: parseInt(info.used_memory || '0'),
      keysCount: parseInt(info.db0?.keys || '0'),
      invalidationsPerHour: 0, // TODO: implementar tracking
      topKeys: [] // TODO: implementar tracking
    };
  }

  private async computeHealthOverview(): Promise<SystemHealthOverview> {
    // Mock data - em produção, usar bibliotecas como 'os' e 'systeminformation'
    const cpuUsage = Math.random() * 100;
    const memoryUsage = Math.random() * 100;
    const diskUsage = Math.random() * 100;

    return {
      cpu: {
        usage: cpuUsage,
        cores: 8,
        loadAverage: [cpuUsage / 100, cpuUsage / 100 * 0.8, cpuUsage / 100 * 0.6]
      },
      memory: {
        used: Math.floor(Math.random() * 8 * 1024 * 1024 * 1024), // GB
        total: 8 * 1024 * 1024 * 1024,
        percentage: memoryUsage,
        free: Math.floor((1 - memoryUsage / 100) * 8 * 1024 * 1024 * 1024)
      },
      disk: {
        used: Math.floor(Math.random() * 500 * 1024 * 1024 * 1024), // GB
        total: 500 * 1024 * 1024 * 1024,
        percentage: diskUsage,
        free: Math.floor((1 - diskUsage / 100) * 500 * 1024 * 1024 * 1024)
      },
      uptime: process.uptime(),
      alerts: this.alerts.filter(alert => !alert.resolved),
      fromCache: false,
      cachedAt: new Date()
    };
  }

  private async computeServicesStatus(): Promise<ServiceStatus[]> {
    const services = [
      { name: 'Database', status: 'healthy' as const, responseTime: 15 },
      { name: 'Redis', status: 'healthy' as const, responseTime: 5 },
      { name: 'AI Agents', status: 'degraded' as const, responseTime: 1200 },
      { name: 'Email Service', status: 'healthy' as const, responseTime: 200 },
      { name: 'File Storage', status: 'healthy' as const, responseTime: 50 },
      { name: 'Payment Gateway', status: 'healthy' as const, responseTime: 300 }
    ];

    return services.map(service => ({
      ...service,
      lastCheck: new Date(),
      metrics: {
        responseTime: service.responseTime,
        uptime: Math.floor(Math.random() * 100),
        requestsPerMinute: Math.floor(Math.random() * 1000)
      },
      description: `${service.name} service status`
    }));
  }

  private async computeSystemMetrics(period: string): Promise<SystemMetrics[]> {
    const now = new Date();
    const hours = period === '1h' ? 1 : period === '24h' ? 24 : period === '7d' ? 168 : 720;
    const interval = period === '1h' ? 5 : 60; // minutos

    const metrics: SystemMetrics[] = [];
    for (let i = 0; i < hours * 60 / interval; i++) {
      const timestamp = new Date(now.getTime() - i * interval * 60 * 1000);
      metrics.push({
        timestamp,
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        networkIn: Math.random() * 1000,
        networkOut: Math.random() * 1000
      });
    }

    return metrics.reverse();
  }

  private async computePerformanceHistory(range: string): Promise<PerformanceHistory> {
    const metrics = await this.computeSystemMetrics(range === '24h' ? '24h' : range === '7d' ? '7d' : '30d');
    
    const avgCpu = metrics.reduce((sum, m) => sum + m.cpu, 0) / metrics.length;
    const avgMemory = metrics.reduce((sum, m) => sum + m.memory, 0) / metrics.length;
    const avgDisk = metrics.reduce((sum, m) => sum + m.disk, 0) / metrics.length;

    return {
      period: range as '24h' | '7d' | '30d',
      metrics,
      avgCpu,
      avgMemory,
      avgDisk
    };
  }

  async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    return {
      status: 'healthy',
      timestamp: new Date()
    };
  }
}

export const systemHealthService = new SystemHealthService();

