/**
 * CRM Pipeline Service - FitOS Sprint 4
 * 
 * Gerencia pipelines de vendas e negócios com cache Redis para performance.
 * 
 * Pattern: PostgreSQL (fonte da verdade) + Redis (cache opcional)
 */

import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../config/database';
import { RedisService } from '../redis.service';
import { logger } from '../../utils/logger';

export interface CRMPipelineCreateInput {
  tenantId: string;
  name: string;
  description?: string;
  stages: Array<{
    name: string;
    order: number;
    color?: string;
    isDefault?: boolean;
  }>;
  isActive: boolean;
  settings?: {
    autoAdvance?: boolean;
    requireApproval?: boolean;
    maxDealsPerStage?: number;
  };
}

export interface CRMPipelineUpdateInput extends Partial<CRMPipelineCreateInput> {
  id: string;
}

export interface CRMPipelineFilters {
  tenantId: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface PipelineStats {
  totalDeals: number;
  dealsByStage: Array<{
    stageName: string;
    count: number;
    value: number;
  }>;
  conversionRate: number;
  averageDealValue: number;
  averageDealDuration: number;
}

export class CRMPipelineService {
  private prisma: PrismaClient;
  private redis: RedisService;

  constructor() {
    this.prisma = getPrismaClient();
    this.redis = new RedisService();
  }

  /**
   * Cria novo pipeline de CRM
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async createPipeline(data: CRMPipelineCreateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const pipeline = await this.prisma.cRMPipeline.create({
        data: {
          tenantId: data.tenantId,
          name: data.name,
          description: data.description as any,
          stages: data.stages as any,
          isActive: data.isActive,
          settings: data.settings as any
        }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidatePipelineCache(data.tenantId);

      logger.info(`✅ CRM Pipeline created: ${pipeline.name} (${pipeline.id})`);
      return pipeline;
    } catch (error) {
      logger.error('Error creating CRM pipeline:', error);
      throw error;
    }
  }

  /**
   * Busca pipeline por ID com cache
   */
  async getPipelineById(id: string) {
    const cacheKey = `crm-pipeline:${id}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'crm',
        ttl: parseInt(process.env.REDIS_TTL_CRM_PIPELINES || '1800')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - CRM Pipeline by ID: ${id}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - CRM Pipeline by ID: ${id}`);
      const pipeline = await this.prisma.cRMPipeline.findUnique({
        where: { id }
      });

      // 3. Cachear se encontrado
      if (pipeline) {
        await this.redis.set(cacheKey, pipeline, {
          namespace: 'crm',
          ttl: parseInt(process.env.REDIS_TTL_CRM_PIPELINES || '1800')
        });
      }

      return pipeline;
    } catch (error) {
      logger.error('Error getting CRM pipeline by ID:', error);
      throw error;
    }
  }

  /**
   * Busca pipelines com filtros e cache
   */
  async getPipelines(filters: CRMPipelineFilters) {
    const cacheKey = this.generateSearchCacheKey(filters);
    
    try {
      // 1. Tentar cache Redis (rápido)
      const cached = await this.redis.get(cacheKey, {
        namespace: 'crm',
        ttl: parseInt(process.env.REDIS_TTL_CRM_PIPELINES || '1800')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - CRM Pipelines: ${cacheKey}`);
        return cached;
      }

      // 2. Cache MISS - buscar PostgreSQL (fonte da verdade)
      logger.info(`🗄️ Cache MISS - CRM Pipelines: ${cacheKey}`);
      
      const whereClause = this.buildWhereClause(filters);
      const pipelines = await this.prisma.cRMPipeline.findMany({
        where: whereClause,
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { createdAt: 'desc' }
      });

      // 3. Cachear no Redis para próximas requests
      await this.redis.set(cacheKey, pipelines, {
        namespace: 'crm',
        ttl: parseInt(process.env.REDIS_TTL_CRM_PIPELINES || '1800')
      });

      return pipelines;
    } catch (error) {
      logger.error('Error getting CRM pipelines:', error);
      throw error;
    }
  }

  /**
   * Busca pipeline padrão do tenant
   */
  async getDefaultPipeline(tenantId: string) {
    const cacheKey = `crm-pipeline:default:${tenantId}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'crm',
        ttl: parseInt(process.env.REDIS_TTL_CRM_PIPELINES || '1800')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Default CRM Pipeline: ${tenantId}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Default CRM Pipeline: ${tenantId}`);
      const pipeline = await this.prisma.cRMPipeline.findFirst({
        where: {
          tenantId,
          isActive: true
        }
      });

      // 3. Cachear
      if (pipeline) {
        await this.redis.set(cacheKey, pipeline, {
          namespace: 'crm',
          ttl: parseInt(process.env.REDIS_TTL_CRM_PIPELINES || '1800')
        });
      }

      return pipeline;
    } catch (error) {
      logger.error('Error getting default CRM pipeline:', error);
      throw error;
    }
  }

  /**
   * Atualiza pipeline de CRM
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async updatePipeline(data: CRMPipelineUpdateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const updateData: any = {};
      
      if (data.name) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.stages) updateData.stages = data.stages as any;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.settings) updateData.settings = data.settings as any;

      const pipeline = await this.prisma.cRMPipeline.update({
        where: { id: data.id },
        data: updateData
      });

      // 2. INVALIDAR cache Redis
      await this.invalidatePipelineCache(pipeline.tenantId, pipeline.id);

      logger.info(`✅ CRM Pipeline updated: ${pipeline.name} (${pipeline.id})`);
      return pipeline;
    } catch (error) {
      logger.error('Error updating CRM pipeline:', error);
      throw error;
    }
  }

  /**
   * Remove pipeline de CRM
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async deletePipeline(id: string) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const pipeline = await this.prisma.cRMPipeline.delete({
        where: { id }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidatePipelineCache(pipeline.tenantId, pipeline.id);

      logger.info(`✅ CRM Pipeline deleted: ${pipeline.name} (${pipeline.id})`);
      return pipeline;
    } catch (error) {
      logger.error('Error deleting CRM pipeline:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas do pipeline
   */
  async getPipelineStats(pipelineId: string) {
    const cacheKey = `crm-pipeline:stats:${pipelineId}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'crm',
        ttl: 300 // 5 minutos para stats
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - CRM Pipeline stats: ${pipelineId}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - CRM Pipeline stats: ${pipelineId}`);
      
      const pipeline = await this.prisma.cRMPipeline.findUnique({
        where: { id: pipelineId },
        select: { stages: true }
      });

      if (!pipeline) {
        throw new Error('Pipeline not found');
      }

      const deals = await this.prisma.deal.findMany({
        where: { pipelineId },
        select: {
          id: true,
          value: true,
          stage: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // Calcular estatísticas
      const totalDeals = deals.length;
      const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const wonDeals = deals.filter(deal => deal.status === 'won');
      const conversionRate = totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0;
      const averageDealValue = totalDeals > 0 ? totalValue / totalDeals : 0;

      // Calcular duração média dos deals
      const completedDeals = deals.filter(deal => deal.status === 'won' || deal.status === 'lost');
      const averageDealDuration = completedDeals.length > 0 
        ? completedDeals.reduce((sum, deal) => {
            const duration = deal.updatedAt.getTime() - deal.createdAt.getTime();
            return sum + duration;
          }, 0) / completedDeals.length / (1000 * 60 * 60 * 24) // em dias
        : 0;

      // Calcular deals por estágio - converter JsonValue para array
      const stages = pipeline.stages as any;
      const stagesArray = Array.isArray(stages) ? stages : [];
      const dealsByStage = stagesArray.map((stage: any) => {
        const stageDeals = deals.filter(deal => deal.stage === stage.name);
        const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        
        return {
          stageName: stage.name,
          count: stageDeals.length,
          value: stageValue
        };
      });

      const stats: PipelineStats = {
        totalDeals,
        dealsByStage,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageDealValue: Math.round(averageDealValue * 100) / 100,
        averageDealDuration: Math.round(averageDealDuration * 100) / 100
      };

      // 3. Cachear
      await this.redis.set(cacheKey, stats, {
        namespace: 'crm',
        ttl: 300 // 5 minutos
      });

      return stats;
    } catch (error) {
      logger.error('Error getting CRM pipeline stats:', error);
      throw error;
    }
  }

  /**
   * Duplica pipeline existente
   */
  async duplicatePipeline(pipelineId: string, newName: string) {
    try {
      const originalPipeline = await this.prisma.cRMPipeline.findUnique({
        where: { id: pipelineId }
      });

      if (!originalPipeline) {
        throw new Error('Pipeline not found');
      }

      const duplicatedPipeline = await this.prisma.cRMPipeline.create({
        data: {
          tenantId: originalPipeline.tenantId,
          name: newName,
          description: `${originalPipeline.description || ''} (Copy)` as any,
          stages: originalPipeline.stages as any,
          isActive: false, // Inativo por padrão
          settings: originalPipeline.settings as any
        }
      });

      // Invalidar cache
      await this.invalidatePipelineCache(originalPipeline.tenantId);

      logger.info(`✅ CRM Pipeline duplicated: ${newName} (${duplicatedPipeline.id})`);
      return duplicatedPipeline;
    } catch (error) {
      logger.error('Error duplicating CRM pipeline:', error);
      throw error;
    }
  }

  /**
   * Gera chave de cache para busca
   */
  private generateSearchCacheKey(filters: CRMPipelineFilters): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key as keyof CRMPipelineFilters]}`)
      .join('|');
    
    return `crm-pipeline:search:${sortedFilters}`;
  }

  /**
   * Constrói cláusula WHERE para busca
   */
  private buildWhereClause(filters: CRMPipelineFilters) {
    const where: any = {
      tenantId: filters.tenantId
    };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return where;
  }

  /**
   * Invalida cache de pipelines de CRM
   */
  private async invalidatePipelineCache(tenantId?: string, pipelineId?: string) {
    try {
      if (pipelineId) {
        // Invalidar cache específico do pipeline
        await this.redis.del(`crm-pipeline:${pipelineId}`, { namespace: 'crm' });
        await this.redis.del(`crm-pipeline:stats:${pipelineId}`, { namespace: 'crm' });
      }

      if (tenantId) {
        // Invalidar cache específico do tenant
        await this.redis.del(`crm-pipeline:default:${tenantId}`, { namespace: 'crm' });
        await this.redis.invalidatePattern(`crm-pipeline:*tenantId:${tenantId}*`, { namespace: 'crm' });
      }

      // Invalidar cache geral
      await this.redis.invalidatePattern('crm-pipeline:search:*', { namespace: 'crm' });

      logger.info('🗑️ CRM Pipeline cache invalidated');
    } catch (error) {
      logger.error('Error invalidating CRM pipeline cache:', error);
      // Não falhar se cache invalidation falhar
    }
  }

  /**
   * Health check do service
   */
  async healthCheck() {
    try {
      // Testar PostgreSQL
      await this.prisma.cRMPipeline.count();
      
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
export const crmPipelineService = new CRMPipelineService();
