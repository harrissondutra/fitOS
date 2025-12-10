import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';
import { MetricsCollectionService } from './metrics-collection.service';
import { emailService } from './email';
import { webhookService } from './webhook.service';

export interface AlertRule {
  id: string;
  name: string;
  type: 'storage' | 'connections' | 'query_time' | 'cpu' | 'memory' | 'data_leak';
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
  organizationId?: string; // null = todas as organizações
  enabled: boolean;
  notificationChannels: string[]; // email, webhook, dashboard
}

/**
 * Alerting Service
 * Sistema de alertas configurável para monitoramento
 */
export class AlertingService {
  private prisma: PrismaClient;
  private metricsService: MetricsCollectionService;
  private alertCheckInterval: NodeJS.Timeout | null = null;
  private alertRules: Map<string, AlertRule> = new Map();

  constructor() {
    this.prisma = getPrismaClient();
    this.metricsService = new MetricsCollectionService();
    logger.info('AlertingService initialized');
  }

  /**
   * Inicia verificação periódica de alertas
   */
  startAlertMonitoring(intervalMinutes: number = 1): void {
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
    }

    this.alertCheckInterval = setInterval(async () => {
      try {
        await this.checkAllAlerts();
      } catch (error) {
        logger.error('Error during alert checking:', error);
      }
    }, intervalMinutes * 60 * 1000);

    // Verificar imediatamente
    this.checkAllAlerts().catch(err => {
      logger.error('Error during initial alert check:', err);
    });

    logger.info(`Started alert monitoring (interval: ${intervalMinutes} minutes)`);
  }

  /**
   * Para verificação de alertas
   */
  stopAlertMonitoring(): void {
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
      this.alertCheckInterval = null;
      logger.info('Stopped alert monitoring');
    }
  }

  /**
   * Verifica todos os alertas ativos
   */
  async checkAllAlerts(): Promise<void> {
    // Carregar regras de alerta (em produção, salvar no banco)
    await this.loadAlertRules();

    const tenants = await this.prisma.tenant.findMany({
      where: { status: 'active' },
      select: { id: true, storageUsageBytes: true, storageLimitBytes: true, connectionCount: true, connectionLimit: true },
    });

    for (const tenant of tenants) {
      await this.checkTenantAlerts(tenant.id, tenant);
    }
  }

  /**
   * Verifica alertas para um tenant específico
   */
  private async checkTenantAlerts(organizationId: string, tenant: any): Promise<void> {
    for (const [ruleId, rule] of this.alertRules.entries()) {
      // Verificar se regra se aplica a este tenant
      if (rule.organizationId && rule.organizationId !== organizationId) {
        continue;
      }

      if (!rule.enabled) {
        continue;
      }

      // Verificar alertas baseados no tipo
      switch (rule.type) {
        case 'storage':
          await this.checkStorageAlert(rule, organizationId, tenant);
          break;
        case 'connections':
          await this.checkConnectionsAlert(rule, organizationId, tenant);
          break;
        case 'query_time':
          await this.checkQueryTimeAlert(rule, organizationId);
          break;
        case 'data_leak':
          await this.checkDataLeakAlert(rule, organizationId);
          break;
      }
    }
  }

  /**
   * Verifica alerta de storage
   */
  private async checkStorageAlert(
    rule: AlertRule,
    organizationId: string,
    tenant: any
  ): Promise<void> {
    if (!tenant.storageLimitBytes) {
      return; // Sem limite definido
    }

    const usagePercent = (Number(tenant.storageUsageBytes) / Number(tenant.storageLimitBytes)) * 100;

    if (this.evaluateThreshold(usagePercent, rule.threshold, rule.operator)) {
      await this.triggerAlert(rule, organizationId, {
        type: 'storage',
        current: usagePercent,
        threshold: rule.threshold,
        message: `Storage usage is at ${usagePercent.toFixed(2)}% (limit: ${rule.threshold}%)`,
      });
    }
  }

  /**
   * Verifica alerta de conexões
   */
  private async checkConnectionsAlert(
    rule: AlertRule,
    organizationId: string,
    tenant: any
  ): Promise<void> {
    if (!tenant.connectionLimit) {
      return;
    }

    const usagePercent = (tenant.connectionCount / tenant.connectionLimit) * 100;

    if (this.evaluateThreshold(usagePercent, rule.threshold, rule.operator)) {
      await this.triggerAlert(rule, organizationId, {
        type: 'connections',
        current: usagePercent,
        threshold: rule.threshold,
        message: `Active connections at ${usagePercent.toFixed(2)}% (limit: ${rule.threshold}%)`,
      });
    }
  }

  /**
   * Verifica alerta de tempo de query
   */
  private async checkQueryTimeAlert(rule: AlertRule, organizationId: string): Promise<void> {
    // Buscar métricas recentes
    const metrics = await this.metricsService.getOrganizationMetrics(organizationId, 1);

    if (metrics.length === 0) {
      return;
    }

    const latestMetric = metrics[0];
    if (!latestMetric.queryAvgTimeMs) {
      return;
    }

    if (this.evaluateThreshold(latestMetric.queryAvgTimeMs, rule.threshold, rule.operator)) {
      await this.triggerAlert(rule, organizationId, {
        type: 'query_time',
        current: latestMetric.queryAvgTimeMs,
        threshold: rule.threshold,
        message: `Average query time is ${latestMetric.queryAvgTimeMs}ms (threshold: ${rule.threshold}ms)`,
      });
    }
  }

  /**
   * Verifica alerta de data leak (queries sem tenant context)
   */
  private async checkDataLeakAlert(rule: AlertRule, organizationId: string): Promise<void> {
    // Buscar acessos sem tenant context nas últimas horas
    const since = new Date();
    since.setHours(since.getHours() - 1);

    const leaks = await this.prisma.tenantAccessAudit.findMany({
      where: {
        organizationId,
        hasTenantContext: false,
        detectedAt: { gte: since },
      },
    });

    if (leaks.length > 0) {
      await this.triggerAlert(rule, organizationId, {
        type: 'data_leak',
        count: leaks.length,
        threshold: rule.threshold,
        message: `Detected ${leaks.length} queries without tenant context in the last hour`,
      });
    }
  }

  /**
   * Avalia se threshold foi atingido
   */
  private evaluateThreshold(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case 'gt':
        return value > threshold;
      case 'lt':
        return value < threshold;
      case 'eq':
        return value === threshold;
      default:
        return false;
    }
  }

  /**
   * Dispara um alerta
   */
  private async triggerAlert(rule: AlertRule, organizationId: string, data: any): Promise<void> {
    logger.warn(`Alert triggered: ${rule.name} for organization ${organizationId}`, data);

    // Registrar alerta no banco para histórico
    await this.recordAlert(rule, organizationId, data);

    // Enviar notificações via canais configurados
    for (const channel of rule.notificationChannels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailAlert(rule, organizationId, data);
            break;
          case 'webhook':
            await this.sendWebhookAlert(rule, organizationId, data);
            break;
          case 'dashboard':
            // Dashboard consome de TenantAccessAudit - já registrado acima
            logger.debug(`Alert available in dashboard for organization ${organizationId}`);
            break;
          default:
            logger.warn(`Unknown notification channel: ${channel}`);
        }
      } catch (error) {
        logger.error(`Failed to send alert via ${channel}:`, error);
        // Não bloquear se um canal falhar
      }
    }
  }

  /**
   * Registra alerta no banco para histórico
   */
  private async recordAlert(rule: AlertRule, organizationId: string, data: any): Promise<void> {
    try {
      await this.prisma.tenantAccessAudit.create({
        data: {
          organizationId,
          action: `alert:${rule.type}`,
          resource: `alert_rule:${rule.id}`,
          query: JSON.stringify({
            rule: rule.name,
            threshold: rule.threshold,
            operator: rule.operator,
            data,
          }),
          hasTenantContext: true,
        },
      });
    } catch (error) {
      logger.error('Failed to record alert in database:', error);
    }
  }

  /**
   * Envia alerta por email
   */
  private async sendEmailAlert(rule: AlertRule, organizationId: string, data: any): Promise<void> {
    try {
      // Obter organização para pegar email de billing
      const organization = await this.prisma.tenant.findUnique({
        where: { id: organizationId },
        select: { billingEmail: true, name: true },
      });

      if (!organization?.billingEmail) {
        logger.warn(`No billing email found for organization ${organizationId}`);
        return;
      }

      const subject = `🚨 Alert: ${rule.name} - ${organization.name}`;
      const html = `
        <h2>Alert Triggered: ${rule.name}</h2>
        <p><strong>Organization:</strong> ${organization.name}</p>
        <p><strong>Rule:</strong> ${rule.name}</p>
        <p><strong>Message:</strong> ${data.message || 'Alert condition detected'}</p>
        <p><strong>Details:</strong></p>
        <pre>${JSON.stringify(data, null, 2)}</pre>
        <p><small>This is an automated alert from FitOS Multi-Tenancy Monitoring System</small></p>
      `;

      await emailService.sendEmail({
        to: organization.billingEmail,
        subject,
        html,
        text: `${rule.name}: ${data.message || 'Alert condition detected'}`,
      });

      logger.info(`Alert email sent to ${organization.billingEmail} for organization ${organizationId}`);
    } catch (error) {
      logger.error('Failed to send alert email:', error);
      throw error;
    }
  }

  /**
   * Envia alerta por webhook
   */
  private async sendWebhookAlert(rule: AlertRule, organizationId: string, data: any): Promise<void> {
    try {
      // Obter configuração de webhook da organização
      const organization = await this.prisma.tenant.findUnique({
        where: { id: organizationId },
        select: { settings: true },
      });

      const webhookUrl = (organization?.settings as any)?.alertWebhookUrl as string | undefined;

      if (!webhookUrl) {
        logger.debug(`No webhook URL configured for organization ${organizationId}`);
        return;
      }

      const payload = {
        type: 'alert',
        rule: {
          id: rule.id,
          name: rule.name,
          type: rule.type,
          threshold: rule.threshold,
        },
        organizationId,
        timestamp: new Date().toISOString(),
        data,
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      logger.info(`Alert webhook sent to ${webhookUrl} for organization ${organizationId}`);
    } catch (error) {
      logger.error('Failed to send alert webhook:', error);
      throw error;
    }
  }

  /**
   * Carrega regras de alerta (placeholder - em produção, salvar no banco)
   */
  private async loadAlertRules(): Promise<void> {
    // Por enquanto, usar regras padrão em memória
    // Em produção, carregar do banco de dados

    if (this.alertRules.size === 0) {
      // Regras padrão
      const defaultRules: AlertRule[] = [
        {
          id: 'storage-80',
          name: 'Storage Usage > 80%',
          type: 'storage',
          threshold: 80,
          operator: 'gt',
          enabled: true,
          notificationChannels: ['dashboard', 'email'],
        },
        {
          id: 'connections-80',
          name: 'Connections > 80%',
          type: 'connections',
          threshold: 80,
          operator: 'gt',
          enabled: true,
          notificationChannels: ['dashboard'],
        },
        {
          id: 'data-leak',
          name: 'Data Leak Detected',
          type: 'data_leak',
          threshold: 0,
          operator: 'gt',
          enabled: true,
          notificationChannels: ['dashboard', 'email', 'webhook'],
        },
      ];

      for (const rule of defaultRules) {
        this.alertRules.set(rule.id, rule);
      }
    }
  }

  /**
   * Cria uma nova regra de alerta
   */
  async createAlertRule(rule: AlertRule): Promise<void> {
    this.alertRules.set(rule.id, rule);
    // TODO: Salvar no banco de dados
    logger.info(`Alert rule created: ${rule.name}`);
  }

  /**
   * Remove uma regra de alerta
   */
  async deleteAlertRule(ruleId: string): Promise<void> {
    this.alertRules.delete(ruleId);
    // TODO: Remover do banco de dados
    logger.info(`Alert rule deleted: ${ruleId}`);
  }
}

