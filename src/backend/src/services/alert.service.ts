/**
 * Alert Service - FitOS
 * 
 * Sistema de alertas para monitoramento Redis:
 * - Alertas de performance
 * - Alertas de memória
 * - Alertas de hit ratio
 * - Alertas de filas
 */

import { redisService } from './redis.service';
import { queueService } from './queue.service';
import { logger } from '../utils/logger';
import { eventBusService } from './event-bus.service';

export interface AlertRule {
  id: string;
  name: string;
  condition: (data: any) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  cooldown: number; // ms
  enabled: boolean;
}

export interface Alert {
  id: string;
  ruleId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  data: any;
  resolved: boolean;
  resolvedAt?: Date;
}

export class AlertService {
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private lastTriggered: Map<string, number> = new Map();
  private isMonitoring = false;
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Inicializar regras padrão de alertas
   */
  private initializeDefaultRules(): void {
    // Alerta de hit ratio baixo
    this.addRule({
      id: 'low-hit-ratio',
      name: 'Low Cache Hit Ratio',
      condition: (data) => data.hitRatio < 0.7,
      severity: 'medium',
      message: 'Cache hit ratio is below 70%',
      cooldown: 5 * 60 * 1000, // 5 minutos
      enabled: true
    });

    // Alerta de memória alta
    this.addRule({
      id: 'high-memory-usage',
      name: 'High Memory Usage',
      condition: (data) => data.usagePercent > 80,
      severity: 'high',
      message: 'Redis memory usage is above 80%',
      cooldown: 2 * 60 * 1000, // 2 minutos
      enabled: true
    });

    // Alerta de memória crítica
    this.addRule({
      id: 'critical-memory-usage',
      name: 'Critical Memory Usage',
      condition: (data) => data.usagePercent > 95,
      severity: 'critical',
      message: 'Redis memory usage is above 95%',
      cooldown: 30 * 1000, // 30 segundos
      enabled: true
    });

    // Alerta de fila com muitos jobs falhados
    this.addRule({
      id: 'high-failed-jobs',
      name: 'High Failed Jobs',
      condition: (data) => data.failedJobs > 10,
      severity: 'medium',
      message: 'High number of failed jobs in queue',
      cooldown: 3 * 60 * 1000, // 3 minutos
      enabled: true
    });

    // Alerta de fila pausada
    this.addRule({
      id: 'queue-paused',
      name: 'Queue Paused',
      condition: (data) => data.paused === true,
      severity: 'high',
      message: 'Queue is paused',
      cooldown: 1 * 60 * 1000, // 1 minuto
      enabled: true
    });

    // Alerta de Redis desconectado
    this.addRule({
      id: 'redis-disconnected',
      name: 'Redis Disconnected',
      condition: (data) => data.status !== 'healthy',
      severity: 'critical',
      message: 'Redis connection is unhealthy',
      cooldown: 10 * 1000, // 10 segundos
      enabled: true
    });

    logger.info('✅ Alert rules initialized');
  }

  /**
   * Adicionar regra de alerta
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    logger.debug(`Alert rule added: ${rule.name}`);
  }

  /**
   * Remover regra de alerta
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    logger.debug(`Alert rule removed: ${ruleId}`);
  }

  /**
   * Iniciar monitoramento
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      logger.warn('Alert monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkAlerts();
    }, intervalMs);

    logger.info(`✅ Alert monitoring started (interval: ${intervalMs}ms)`);
  }

  /**
   * Parar monitoramento
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      logger.warn('Alert monitoring is not running');
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    logger.info('✅ Alert monitoring stopped');
  }

  /**
   * Verificar alertas
   */
  private async checkAlerts(): Promise<void> {
    try {
      // Verificar saúde do Redis
      await this.checkRedisHealth();
      
      // Verificar estatísticas de cache
      await this.checkCacheStats();
      
      // Verificar estatísticas de filas
      await this.checkQueueStats();
      
    } catch (error) {
      logger.error('Error checking alerts:', error);
    }
  }

  /**
   * Verificar saúde do Redis
   */
  private async checkRedisHealth(): Promise<void> {
    try {
      const health = await redisService.healthCheck();
      const info = await redisService.getInfo();
      
      const data = {
        status: health.status,
        latency: health.latency,
        memory: info.used_memory,
        connectedClients: info.connected_clients
      };

      this.evaluateRule('redis-disconnected', data);
    } catch (error) {
      this.evaluateRule('redis-disconnected', { status: 'unhealthy' });
    }
  }

  /**
   * Verificar estatísticas de cache
   */
  private async checkCacheStats(): Promise<void> {
    try {
      const stats = redisService.getStats();
      const info = await redisService.getInfo();
      
      const hits = info.keyspace_hits || 0;
      const misses = info.keyspace_misses || 0;
      const total = hits + misses;
      const hitRatio = total > 0 ? hits / total : 0;

      const data = {
        hitRatio,
        hits,
        misses,
        total
      };

      this.evaluateRule('low-hit-ratio', data);

      // Verificar uso de memória
      const usedMemory = info.used_memory || 0;
      const totalMemory = info.total_system_memory || 1;
      const usagePercent = (usedMemory / totalMemory) * 100;

      const memoryData = {
        usagePercent,
        usedMemory,
        totalMemory
      };

      this.evaluateRule('high-memory-usage', memoryData);
      this.evaluateRule('critical-memory-usage', memoryData);
    } catch (error) {
      logger.error('Error checking cache stats:', error);
    }
  }

  /**
   * Verificar estatísticas de filas
   */
  private async checkQueueStats(): Promise<void> {
    try {
      const queueStats = await queueService.getQueueStats();
      
      for (const queue of queueStats) {
        const data = {
          queueName: queue.name,
          failedJobs: queue.failed,
          paused: queue.paused,
          waiting: queue.waiting,
          active: queue.active
        };

        this.evaluateRule('high-failed-jobs', data);
        this.evaluateRule('queue-paused', data);
      }
    } catch (error) {
      logger.error('Error checking queue stats:', error);
    }
  }

  /**
   * Avaliar regra de alerta
   */
  private evaluateRule(ruleId: string, data: any): void {
    const rule = this.rules.get(ruleId);
    if (!rule || !rule.enabled) {
      return;
    }

    // Verificar cooldown
    const lastTriggered = this.lastTriggered.get(ruleId) || 0;
    const now = Date.now();
    
    if (now - lastTriggered < rule.cooldown) {
      return;
    }

    // Verificar condição
    if (rule.condition(data)) {
      this.triggerAlert(rule, data);
      this.lastTriggered.set(ruleId, now);
    }
  }

  /**
   * Disparar alerta
   */
  private triggerAlert(rule: AlertRule, data: any): void {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      message: rule.message,
      severity: rule.severity,
      timestamp: new Date(),
      data,
      resolved: false
    };

    this.alerts.set(alertId, alert);

    // Publicar evento de alerta
    eventBusService.publishSystemEvent('warning', {
      alertId,
      ruleId: rule.id,
      severity: rule.severity,
      message: rule.message,
      data
    });

    // Log do alerta
    const logLevel = rule.severity === 'critical' ? 'error' : 
                    rule.severity === 'high' ? 'warn' : 'info';
    
    logger[logLevel](`🚨 ALERT: ${rule.name} - ${rule.message}`, {
      alertId,
      ruleId: rule.id,
      severity: rule.severity,
      data
    });
  }

  /**
   * Resolver alerta
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();

    logger.info(`Alert resolved: ${alertId} - ${alert.message}`);

    // Publicar evento de resolução
    eventBusService.publishSystemEvent('warning', {
      alertId,
      ruleId: alert.ruleId,
      message: alert.message
    });
  }

  /**
   * Obter alertas ativos
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Obter alertas por severidade
   */
  getAlertsBySeverity(severity: string): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => alert.severity === severity)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Obter estatísticas de alertas
   */
  getAlertStats(): {
    total: number;
    active: number;
    resolved: number;
    bySeverity: Record<string, number>;
    recent: Alert[];
  } {
    const allAlerts = Array.from(this.alerts.values());
    const active = allAlerts.filter(alert => !alert.resolved);
    const resolved = allAlerts.filter(alert => alert.resolved);
    
    const bySeverity: Record<string, number> = {};
    for (const alert of allAlerts) {
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
    }

    const recent = allAlerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      total: allAlerts.length,
      active: active.length,
      resolved: resolved.length,
      bySeverity,
      recent
    };
  }

  /**
   * Limpar alertas antigos
   */
  cleanupOldAlerts(daysToKeep: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let removedCount = 0;
    
    for (const [alertId, alert] of this.alerts) {
      if (alert.timestamp < cutoffDate) {
        this.alerts.delete(alertId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.info(`Cleaned up ${removedCount} old alerts`);
    }
  }

  /**
   * Verificar se está monitorando
   */
  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  /**
   * Obter regras de alerta
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Habilitar/desabilitar regra
   */
  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      logger.info(`Alert rule ${ruleId} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }
}

// Instância singleton
export const alertService = new AlertService();
