/**
 * Deal Service - FitOS Sprint 4
 * 
 * Gerencia negócios e oportunidades de vendas com cache Redis para performance.
 * 
 * Pattern: PostgreSQL (fonte da verdade) + Redis (cache opcional)
 */

import { PrismaClient } from '@prisma/client';
import { RedisService } from '../redis.service';
import { logger } from '../../utils/logger';

export interface DealCreateInput {
  tenantId: string;
  pipelineId: string;
  title: string;
  description?: string;
  value?: number;
  stage: string;
  status: 'open' | 'won' | 'lost' | 'paused';
  clientId?: string;
  assignedTo?: string;
  expectedCloseDate?: Date;
  priority: 'low' | 'medium' | 'high';
  source?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface DealUpdateInput extends Partial<DealCreateInput> {
  id: string;
}

export interface DealFilters {
  tenantId: string;
  pipelineId?: string;
  clientId?: string;
  assignedTo?: string;
  status?: string;
  stage?: string;
  priority?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface DealStats {
  total: number;
  totalValue: number;
  won: number;
  wonValue: number;
  lost: number;
  lostValue: number;
  open: number;
  openValue: number;
  conversionRate: number;
  averageDealValue: number;
  averageDealDuration: number;
  dealsByStage: Array<{
    stage: string;
    count: number;
    value: number;
  }>;
  dealsByStatus: Array<{
    status: string;
    count: number;
    value: number;
  }>;
}

export class DealService {
  private prisma: PrismaClient;
  private redis: RedisService;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new RedisService();
  }

  /**
   * Cria novo negócio
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async createDeal(data: DealCreateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const deal = await this.prisma.deal.create({
        data: {
          tenantId: data.tenantId,
          pipelineId: data.pipelineId,
          clientProfileId: data.clientId!,
          title: data.title,
          description: data.description,
          value: data.value || 0,
          stage: data.stage,
          status: data.status,
          assignedUserId: data.assignedTo,
          expectedCloseDate: data.expectedCloseDate || new Date(),
          probability: 50
        }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateDealCache(data.tenantId, data.pipelineId);

      logger.info(`✅ Deal created: ${deal.title} (${deal.id})`);
      return deal;
    } catch (error) {
      logger.error('Error creating deal:', error);
      throw error;
    }
  }

  /**
   * Busca negócio por ID com cache
   */
  async getDealById(id: string) {
    const cacheKey = `deal:${id}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'crm',
        ttl: parseInt(process.env.REDIS_TTL_CRM_DEALS || '1800')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Deal by ID: ${id}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Deal by ID: ${id}`);
      const deal = await this.prisma.deal.findUnique({
        where: { id }
      });

      // 3. Cachear se encontrado
      if (deal) {
        await this.redis.set(cacheKey, deal, {
          namespace: 'crm',
          ttl: parseInt(process.env.REDIS_TTL_CRM_DEALS || '1800')
        });
      }

      return deal;
    } catch (error) {
      logger.error('Error getting deal by ID:', error);
      throw error;
    }
  }

  /**
   * Busca negócios com filtros e cache
   */
  async getDeals(filters: DealFilters) {
    const cacheKey = this.generateSearchCacheKey(filters);
    
    try {
      // 1. Tentar cache Redis (rápido)
      const cached = await this.redis.get(cacheKey, {
        namespace: 'crm',
        ttl: parseInt(process.env.REDIS_TTL_CRM_DEALS || '1800')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Deals: ${cacheKey}`);
        return cached;
      }

      // 2. Cache MISS - buscar PostgreSQL (fonte da verdade)
      logger.info(`🗄️ Cache MISS - Deals: ${cacheKey}`);
      
      const whereClause = this.buildWhereClause(filters);
      const deals = await this.prisma.deal.findMany({
        where: whereClause,
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { updatedAt: 'desc' }
      });

      // 3. Cachear no Redis para próximas requests
      await this.redis.set(cacheKey, deals, {
        namespace: 'crm',
        ttl: parseInt(process.env.REDIS_TTL_CRM_DEALS || '1800')
      });

      return deals;
    } catch (error) {
      logger.error('Error getting deals:', error);
      throw error;
    }
  }

  /**
   * Atualiza negócio
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async updateDeal(data: DealUpdateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const updateData: any = {};
      
      if (data.title) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.value !== undefined) updateData.value = data.value;
      if (data.stage) updateData.stage = data.stage;
      if (data.status) updateData.status = data.status;
      if (data.clientId !== undefined) updateData.clientProfileId = data.clientId;
      if (data.assignedTo !== undefined) updateData.assignedUserId = data.assignedTo;
      if (data.expectedCloseDate !== undefined) updateData.expectedCloseDate = data.expectedCloseDate;

      const deal = await this.prisma.deal.update({
        where: { id: data.id },
        data: updateData
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateDealCache(deal.tenantId, deal.pipelineId, deal.id);

      logger.info(`✅ Deal updated: ${deal.title} (${deal.id})`);
      return deal;
    } catch (error) {
      logger.error('Error updating deal:', error);
      throw error;
    }
  }

  /**
   * Remove negócio
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async deleteDeal(id: string) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const deal = await this.prisma.deal.delete({
        where: { id }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateDealCache(deal.tenantId, deal.pipelineId, deal.id);

      logger.info(`✅ Deal deleted: ${deal.title} (${deal.id})`);
      return deal;
    } catch (error) {
      logger.error('Error deleting deal:', error);
      throw error;
    }
  }

  /**
   * Move negócio para próximo estágio
   */
  async advanceDeal(dealId: string, newStage: string, notes?: string) {
    try {
      const deal = await this.prisma.deal.update({
        where: { id: dealId },
        data: {
          stage: newStage
        }
      });

      // TODO: Criar atividade de avanço quando modelo dealActivity for criado
      // if (notes) {
      //   await this.prisma.dealActivity.create({
      //     data: {
      //       dealId,
      //       type: 'stage_change',
      //       description: `Deal moved to ${newStage}`,
      //       metadata: {
      //         oldStage: deal.stage,
      //         newStage,
      //         notes
      //       }
      //     }
      //   });
      // }

      // Invalidar cache
      await this.invalidateDealCache(deal.tenantId, deal.pipelineId, deal.id);

      logger.info(`✅ Deal advanced: ${deal.title} to ${newStage} (${deal.id})`);
      return deal;
    } catch (error) {
      logger.error('Error advancing deal:', error);
      throw error;
    }
  }

  /**
   * Fecha negócio (won/lost)
   */
  async closeDeal(dealId: string, status: 'won' | 'lost', notes?: string) {
    try {
      const deal = await this.prisma.deal.update({
        where: { id: dealId },
        data: {
          status,
          closedAt: new Date()
        }
      });

      // TODO: Criar atividade de fechamento quando modelo dealActivity for criado
      // await this.prisma.dealActivity.create({
      //   data: {
      //     dealId,
      //     type: 'deal_closed',
      //     description: `Deal ${status}`,
      //     metadata: {
      //       status,
      //       notes
      //     }
      //   }
      // });

      // Invalidar cache
      await this.invalidateDealCache(deal.tenantId, deal.pipelineId, deal.id);

      logger.info(`✅ Deal closed: ${deal.title} as ${status} (${deal.id})`);
      return deal;
    } catch (error) {
      logger.error('Error closing deal:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas de negócios
   */
  async getDealStats(filters: DealFilters) {
    const cacheKey = this.generateStatsCacheKey(filters);
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'crm',
        ttl: 300 // 5 minutos para stats
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Deal stats: ${cacheKey}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Deal stats: ${cacheKey}`);
      
      const whereClause = this.buildWhereClause(filters);
      const deals = await this.prisma.deal.findMany({
        where: whereClause,
        select: {
          id: true,
          value: true,
          stage: true,
          status: true,
          createdAt: true,
          closedAt: true
        }
      });

      // Calcular estatísticas
      const total = deals.length;
      const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const won = deals.filter(deal => deal.status === 'won');
      const wonValue = won.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const lost = deals.filter(deal => deal.status === 'lost');
      const lostValue = lost.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const open = deals.filter(deal => deal.status === 'open');
      const openValue = open.reduce((sum, deal) => sum + (deal.value || 0), 0);

      const conversionRate = total > 0 ? ((won.length + lost.length) > 0 ? (won.length / (won.length + lost.length)) * 100 : 0) : 0;
      const averageDealValue = total > 0 ? totalValue / total : 0;

      // Calcular duração média dos deals fechados
      const closedDeals = deals.filter(deal => deal.closedAt);
      const averageDealDuration = closedDeals.length > 0 
        ? closedDeals.reduce((sum, deal) => {
            const duration = deal.closedAt!.getTime() - deal.createdAt.getTime();
            return sum + duration;
          }, 0) / closedDeals.length / (1000 * 60 * 60 * 24) // em dias
        : 0;

      // Calcular deals por estágio
      const stageGroups = deals.reduce((acc, deal) => {
        if (!acc[deal.stage]) {
          acc[deal.stage] = { count: 0, value: 0 };
        }
        acc[deal.stage].count++;
        acc[deal.stage].value += deal.value || 0;
        return acc;
      }, {} as Record<string, { count: number; value: number }>);

      const dealsByStage = Object.entries(stageGroups).map(([stage, data]) => ({
        stage,
        count: data.count,
        value: data.value
      }));

      // Calcular deals por status
      const statusGroups = deals.reduce((acc, deal) => {
        if (!acc[deal.status]) {
          acc[deal.status] = { count: 0, value: 0 };
        }
        acc[deal.status].count++;
        acc[deal.status].value += deal.value || 0;
        return acc;
      }, {} as Record<string, { count: number; value: number }>);

      const dealsByStatus = Object.entries(statusGroups).map(([status, data]) => ({
        status,
        count: data.count,
        value: data.value
      }));

      const stats: DealStats = {
        total,
        totalValue,
        won: won.length,
        wonValue,
        lost: lost.length,
        lostValue,
        open: open.length,
        openValue,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageDealValue: Math.round(averageDealValue * 100) / 100,
        averageDealDuration: Math.round(averageDealDuration * 100) / 100,
        dealsByStage,
        dealsByStatus
      };

      // 3. Cachear
      await this.redis.set(cacheKey, stats, {
        namespace: 'crm',
        ttl: 300 // 5 minutos
      });

      return stats;
    } catch (error) {
      logger.error('Error getting deal stats:', error);
      throw error;
    }
  }

  /**
   * Busca negócios próximos do vencimento
   */
  async getUpcomingDeals(tenantId: string, days: number = 7) {
    const cacheKey = `deal:upcoming:${tenantId}:${days}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'crm',
        ttl: 300 // 5 minutos
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Upcoming deals: ${tenantId}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Upcoming deals: ${tenantId}`);
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const deals = await this.prisma.deal.findMany({
        where: {
          tenantId,
          status: 'open',
          expectedCloseDate: {
            lte: futureDate,
            gte: new Date()
          }
        },
        orderBy: { expectedCloseDate: 'asc' }
      });

      // 3. Cachear
      await this.redis.set(cacheKey, deals, {
        namespace: 'crm',
        ttl: 300 // 5 minutos
      });

      return deals;
    } catch (error) {
      logger.error('Error getting upcoming deals:', error);
      throw error;
    }
  }

  /**
   * Gera chave de cache para busca
   */
  private generateSearchCacheKey(filters: DealFilters): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key as keyof DealFilters]}`)
      .join('|');
    
    return `deal:search:${sortedFilters}`;
  }

  /**
   * Gera chave de cache para estatísticas
   */
  private generateStatsCacheKey(filters: DealFilters): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key as keyof DealFilters]}`)
      .join('|');
    
    return `deal:stats:${sortedFilters}`;
  }

  /**
   * Constrói cláusula WHERE para busca
   */
  private buildWhereClause(filters: DealFilters) {
    const where: any = {
      tenantId: filters.tenantId
    };

    if (filters.pipelineId) {
      where.pipelineId = filters.pipelineId;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.stage) {
      where.stage = filters.stage;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return where;
  }

  /**
   * Invalida cache de negócios
   */
  private async invalidateDealCache(tenantId?: string, pipelineId?: string, dealId?: string) {
    try {
      if (dealId) {
        // Invalidar cache específico do deal
        await this.redis.del(`deal:${dealId}`, { namespace: 'crm' });
      }

      if (pipelineId) {
        // Invalidar cache específico do pipeline
        await this.redis.invalidatePattern(`deal:*pipelineId:${pipelineId}*`, { namespace: 'crm' });
      }

      if (tenantId) {
        // Invalidar cache específico do tenant
        await this.redis.invalidatePattern(`deal:*tenantId:${tenantId}*`, { namespace: 'crm' });
        await this.redis.del(`deal:upcoming:${tenantId}:*`, { namespace: 'crm' });
      }

      // Invalidar cache geral
      await this.redis.invalidatePattern('deal:search:*', { namespace: 'crm' });
      await this.redis.invalidatePattern('deal:stats:*', { namespace: 'crm' });

      logger.info('🗑️ Deal cache invalidated');
    } catch (error) {
      logger.error('Error invalidating deal cache:', error);
      // Não falhar se cache invalidation falhar
    }
  }

  /**
   * Health check do service
   */
  async healthCheck() {
    try {
      // Testar PostgreSQL
      await this.prisma.deal.count();
      
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
export const dealService = new DealService();
