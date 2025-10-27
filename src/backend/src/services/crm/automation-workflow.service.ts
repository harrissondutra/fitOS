/**
 * Automation Workflow Service - FitOS Sprint 4
 * 
 * Gerencia workflows de automação do CRM com cache Redis para performance.
 * 
 * Pattern: PostgreSQL (fonte da verdade) + Redis (cache opcional)
 */

import { PrismaClient } from '@prisma/client';
import { RedisService } from '../redis.service';
import { logger } from '../../utils/logger';

export interface AutomationWorkflowCreateInput {
  tenantId: string;
  name: string;
  description?: string;
  trigger: {
    type: 'deal_created' | 'deal_updated' | 'deal_stage_changed' | 'deal_closed' | 'client_created' | 'appointment_scheduled' | 'email_received' | 'webhook';
    conditions?: Record<string, any>;
  };
  actions: Array<{
    type: 'send_email' | 'create_task' | 'update_deal' | 'send_whatsapp' | 'create_notification' | 'webhook_call';
    config: Record<string, any>;
    delay?: number; // em minutos
  }>;
  isActive: boolean;
  settings?: {
    maxExecutions?: number;
    executionDelay?: number;
    retryAttempts?: number;
  };
}

export interface AutomationWorkflowUpdateInput extends Partial<AutomationWorkflowCreateInput> {
  id: string;
}

export interface AutomationWorkflowFilters {
  tenantId: string;
  isActive?: boolean;
  triggerType?: string;
  limit?: number;
  offset?: number;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  executionId: string;
  status: 'success' | 'failed' | 'partial';
  actionsExecuted: number;
  actionsFailed: number;
  errorMessage?: string;
  executionTime: number;
  metadata?: Record<string, any>;
}

export interface WorkflowStats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  executionsByTrigger: Array<{
    triggerType: string;
    count: number;
  }>;
}

export class AutomationWorkflowService {
  private prisma: PrismaClient;
  private redis: RedisService;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new RedisService();
  }

  /**
   * Cria novo workflow de automação
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async createWorkflow(data: AutomationWorkflowCreateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const workflow = await this.prisma.automationWorkflow.create({
        data: {
          tenantId: data.tenantId,
          name: data.name,
          description: data.description,
          trigger: data.trigger,
          actions: data.actions,
          isActive: data.isActive,
          settings: data.settings || {}
        }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateWorkflowCache(data.tenantId);

      logger.info(`✅ Automation Workflow created: ${workflow.name} (${workflow.id})`);
      return workflow;
    } catch (error) {
      logger.error('Error creating automation workflow:', error);
      throw error;
    }
  }

  /**
   * Busca workflow por ID com cache
   */
  async getWorkflowById(id: string) {
    const cacheKey = `automation-workflow:${id}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'crm',
        ttl: parseInt(process.env.REDIS_TTL_CRM_AUTOMATIONS || '1800')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Automation Workflow by ID: ${id}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Automation Workflow by ID: ${id}`);
      const workflow = await this.prisma.automationWorkflow.findUnique({
        where: { id },
        include: {
          executions: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      // 3. Cachear se encontrado
      if (workflow) {
        await this.redis.set(cacheKey, workflow, {
          namespace: 'crm',
          ttl: parseInt(process.env.REDIS_TTL_CRM_AUTOMATIONS || '1800')
        });
      }

      return workflow;
    } catch (error) {
      logger.error('Error getting automation workflow by ID:', error);
      throw error;
    }
  }

  /**
   * Busca workflows com filtros e cache
   */
  async getWorkflows(filters: AutomationWorkflowFilters) {
    const cacheKey = this.generateSearchCacheKey(filters);
    
    try {
      // 1. Tentar cache Redis (rápido)
      const cached = await this.redis.get(cacheKey, {
        namespace: 'crm',
        ttl: parseInt(process.env.REDIS_TTL_CRM_AUTOMATIONS || '1800')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Automation Workflows: ${cacheKey}`);
        return cached;
      }

      // 2. Cache MISS - buscar PostgreSQL (fonte da verdade)
      logger.info(`🗄️ Cache MISS - Automation Workflows: ${cacheKey}`);
      
      const whereClause = this.buildWhereClause(filters);
      const workflows = await this.prisma.automationWorkflow.findMany({
        where: whereClause,
        include: {
          executions: {
            select: {
              id: true,
              status: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        },
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { createdAt: 'desc' }
      });

      // 3. Cachear no Redis para próximas requests
      await this.redis.set(cacheKey, workflows, {
        namespace: 'crm',
        ttl: parseInt(process.env.REDIS_TTL_CRM_AUTOMATIONS || '1800')
      });

      return workflows;
    } catch (error) {
      logger.error('Error getting automation workflows:', error);
      throw error;
    }
  }

  /**
   * Busca workflows ativos por tipo de trigger
   */
  async getActiveWorkflowsByTrigger(tenantId: string, triggerType: string) {
    const cacheKey = `automation-workflow:active:${tenantId}:${triggerType}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'crm',
        ttl: parseInt(process.env.REDIS_TTL_CRM_AUTOMATIONS || '1800')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Active workflows by trigger: ${triggerType}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Active workflows by trigger: ${triggerType}`);
      const workflows = await this.prisma.automationWorkflow.findMany({
        where: {
          tenantId,
          isActive: true,
          trigger: {
            path: ['type'],
            equals: triggerType
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      // 3. Cachear
      await this.redis.set(cacheKey, workflows, {
        namespace: 'crm',
        ttl: parseInt(process.env.REDIS_TTL_CRM_AUTOMATIONS || '1800')
      });

      return workflows;
    } catch (error) {
      logger.error('Error getting active workflows by trigger:', error);
      throw error;
    }
  }

  /**
   * Atualiza workflow de automação
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async updateWorkflow(data: AutomationWorkflowUpdateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const updateData: any = {};
      
      if (data.name) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.trigger) updateData.trigger = data.trigger;
      if (data.actions) updateData.actions = data.actions;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.settings) updateData.settings = data.settings;

      const workflow = await this.prisma.automationWorkflow.update({
        where: { id: data.id },
        data: updateData
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateWorkflowCache(workflow.tenantId, workflow.id);

      logger.info(`✅ Automation Workflow updated: ${workflow.name} (${workflow.id})`);
      return workflow;
    } catch (error) {
      logger.error('Error updating automation workflow:', error);
      throw error;
    }
  }

  /**
   * Remove workflow de automação
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async deleteWorkflow(id: string) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const workflow = await this.prisma.automationWorkflow.delete({
        where: { id }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateWorkflowCache(workflow.tenantId, workflow.id);

      logger.info(`✅ Automation Workflow deleted: ${workflow.name} (${workflow.id})`);
      return workflow;
    } catch (error) {
      logger.error('Error deleting automation workflow:', error);
      throw error;
    }
  }

  /**
   * Executa workflow de automação
   */
  async executeWorkflow(workflowId: string, triggerData: Record<string, any>) {
    const startTime = Date.now();
    
    try {
      const workflow = await this.prisma.automationWorkflow.findUnique({
        where: { id: workflowId }
      });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      if (!workflow.isActive) {
        throw new Error('Workflow is not active');
      }

      // Verificar condições do trigger
      if (!this.checkTriggerConditions(workflow.trigger, triggerData)) {
        logger.info(`Trigger conditions not met for workflow: ${workflow.name}`);
        return null;
      }

      // Criar execução
      const execution = await this.prisma.automationWorkflowExecution.create({
        data: {
          workflowId,
          status: 'running',
          result: triggerData
        }
      });

      let actionsExecuted = 0;
      let actionsFailed = 0;
      let lastError: string | undefined;

      // Executar ações
      const actions = Array.isArray(workflow.actions) ? workflow.actions : [];
      for (const action of actions) {
        try {
          // Aplicar delay se configurado
          const actionDelay = (action as any).delay;
          if (actionDelay && actionDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, actionDelay * 60 * 1000));
          }

          await this.executeAction(action as any, triggerData);
          actionsExecuted++;
        } catch (error) {
          actionsFailed++;
          lastError = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Action execution failed: ${(action as any).type}`, error);
        }
      }

      // Atualizar execução
      const executionTime = Date.now() - startTime;
      const status = actionsFailed === 0 ? 'success' : (actionsExecuted === 0 ? 'failed' : 'partial');

      await this.prisma.automationWorkflowExecution.update({
        where: { id: execution.id },
        data: {
          status,
          executionTime,
          errorMessage: lastError,
          result: {
            actionsExecuted,
            actionsFailed,
            errorMessage: lastError,
            executionTime,
            metadata: triggerData
          }
        }
      });

      const result: WorkflowExecutionResult = {
        workflowId,
        executionId: execution.id,
        status,
        actionsExecuted,
        actionsFailed,
        errorMessage: lastError,
        executionTime,
        metadata: triggerData
      };

      logger.info(`✅ Workflow executed: ${workflow.name} (${execution.id}) - ${status}`);
      return result;
    } catch (error) {
      logger.error('Error executing automation workflow:', error);
      throw error;
    }
  }

  /**
   * Verifica condições do trigger
   */
  private checkTriggerConditions(trigger: any, triggerData: Record<string, any>): boolean {
    if (!trigger.conditions) {
      return true;
    }

    // Implementar lógica de verificação de condições
    // Por exemplo: verificar se o valor do deal é maior que X
    for (const [key, value] of Object.entries(trigger.conditions)) {
      if (triggerData[key] !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Executa ação específica
   */
  private async executeAction(action: any, triggerData: Record<string, any>) {
    switch (action.type) {
      case 'send_email':
        await this.executeEmailAction(action.config, triggerData);
        break;
      case 'create_task':
        await this.executeTaskAction(action.config, triggerData);
        break;
      case 'update_deal':
        await this.executeDealUpdateAction(action.config, triggerData);
        break;
      case 'send_whatsapp':
        await this.executeWhatsAppAction(action.config, triggerData);
        break;
      case 'create_notification':
        await this.executeNotificationAction(action.config, triggerData);
        break;
      case 'webhook_call':
        await this.executeWebhookAction(action.config, triggerData);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Executa ação de email
   */
  private async executeEmailAction(config: any, triggerData: Record<string, any>) {
    // Implementar envio de email
    logger.info('Executing email action:', config);
  }

  /**
   * Executa ação de tarefa
   */
  private async executeTaskAction(config: any, triggerData: Record<string, any>) {
    // Implementar criação de tarefa
    logger.info('Executing task action:', config);
  }

  /**
   * Executa ação de atualização de deal
   */
  private async executeDealUpdateAction(config: any, triggerData: Record<string, any>) {
    // Implementar atualização de deal
    logger.info('Executing deal update action:', config);
  }

  /**
   * Executa ação de WhatsApp
   */
  private async executeWhatsAppAction(config: any, triggerData: Record<string, any>) {
    // Implementar envio de WhatsApp
    logger.info('Executing WhatsApp action:', config);
  }

  /**
   * Executa ação de notificação
   */
  private async executeNotificationAction(config: any, triggerData: Record<string, any>) {
    // Implementar criação de notificação
    logger.info('Executing notification action:', config);
  }

  /**
   * Executa ação de webhook
   */
  private async executeWebhookAction(config: any, triggerData: Record<string, any>) {
    // Implementar chamada de webhook
    logger.info('Executing webhook action:', config);
  }

  /**
   * Busca estatísticas de workflows
   */
  async getWorkflowStats(tenantId: string) {
    const cacheKey = `automation-workflow:stats:${tenantId}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'crm',
        ttl: 300 // 5 minutos para stats
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Workflow stats: ${tenantId}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Workflow stats: ${tenantId}`);
      
      const [
        totalWorkflows,
        activeWorkflows,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        executionsByTrigger
      ] = await Promise.all([
        this.prisma.automationWorkflow.count({
          where: { tenantId }
        }),
        this.prisma.automationWorkflow.count({
          where: { tenantId, isActive: true }
        }),
        this.prisma.automationWorkflowExecution.count({
          where: { workflow: { tenantId } }
        }),
        this.prisma.automationWorkflowExecution.count({
          where: { 
            workflow: { tenantId },
            status: 'success'
          }
        }),
        this.prisma.automationWorkflowExecution.count({
          where: { 
            workflow: { tenantId },
            status: 'failed'
          }
        }),
        this.prisma.automationWorkflowExecution.groupBy({
          by: ['workflowId'],
          where: { workflow: { tenantId } },
          _count: { workflowId: true }
        })
      ]);

      const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

      // Calcular tempo médio de execução
      const executions = await this.prisma.automationWorkflowExecution.findMany({
        where: { workflow: { tenantId } },
        select: { executionTime: true }
      });

      const averageExecutionTime = executions.length > 0 
        ? executions.reduce((sum, exec) => sum + exec.executionTime, 0) / executions.length
        : 0;

      const stats: WorkflowStats = {
        totalWorkflows,
        activeWorkflows,
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        successRate: Math.round(successRate * 100) / 100,
        averageExecutionTime: Math.round(averageExecutionTime * 100) / 100,
        executionsByTrigger: executionsByTrigger.map(item => ({
          triggerType: 'unknown', // Seria necessário buscar o tipo do trigger
          count: item._count.workflowId
        }))
      };

      // 3. Cachear
      await this.redis.set(cacheKey, stats, {
        namespace: 'crm',
        ttl: 300 // 5 minutos
      });

      return stats;
    } catch (error) {
      logger.error('Error getting workflow stats:', error);
      throw error;
    }
  }

  /**
   * Gera chave de cache para busca
   */
  private generateSearchCacheKey(filters: AutomationWorkflowFilters): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key as keyof AutomationWorkflowFilters]}`)
      .join('|');
    
    return `automation-workflow:search:${sortedFilters}`;
  }

  /**
   * Constrói cláusula WHERE para busca
   */
  private buildWhereClause(filters: AutomationWorkflowFilters) {
    const where: any = {
      tenantId: filters.tenantId
    };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.triggerType) {
      where.trigger = {
        path: '$.type',
        equals: filters.triggerType
      };
    }

    return where;
  }

  /**
   * Invalida cache de workflows de automação
   */
  private async invalidateWorkflowCache(tenantId?: string, workflowId?: string) {
    try {
      if (workflowId) {
        // Invalidar cache específico do workflow
        await this.redis.del(`automation-workflow:${workflowId}`, { namespace: 'crm' });
      }

      if (tenantId) {
        // Invalidar cache específico do tenant
        await this.redis.invalidatePattern(`automation-workflow:*tenantId:${tenantId}*`, { namespace: 'crm' });
        await this.redis.del(`automation-workflow:stats:${tenantId}`, { namespace: 'crm' });
        await this.redis.invalidatePattern(`automation-workflow:active:${tenantId}:*`, { namespace: 'crm' });
      }

      // Invalidar cache geral
      await this.redis.invalidatePattern('automation-workflow:search:*', { namespace: 'crm' });

      logger.info('🗑️ Automation Workflow cache invalidated');
    } catch (error) {
      logger.error('Error invalidating automation workflow cache:', error);
      // Não falhar se cache invalidation falhar
    }
  }

  /**
   * Health check do service
   */
  async healthCheck() {
    try {
      // Testar PostgreSQL
      await this.prisma.automationWorkflow.count();
      
      // Testar Redis
      const redisHealth = await this.redis.healthCheck();
      
      return {
        status: 'healthy',
        database: 'connected',
        redis: redisHealth.status,
        redisLatency: redisHealth.latency
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Instância singleton
export const automationWorkflowService = new AutomationWorkflowService();
