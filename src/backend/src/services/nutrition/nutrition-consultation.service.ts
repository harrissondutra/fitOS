/**
 * Nutrition Consultation Service - FitOS Sprint 4
 * 
 * Gerencia consultas nutricionais com cache Redis para performance.
 * 
 * Pattern: PostgreSQL (fonte da verdade) + Redis (cache opcional)
 */

import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../config/database';
const prisma = getPrismaClient();
import { RedisService } from '../redis.service';
import { logger } from '../../utils/logger';

export interface NutritionConsultationCreateInput {
  tenantId: string;
  clientId: string;
  nutritionistId: string;
  scheduledAt: Date;
  duration?: number;
  notes?: string;
  recommendations?: string;
  followUpDate?: Date;
}

export interface NutritionConsultationUpdateInput extends Partial<NutritionConsultationCreateInput> {
  id: string;
}

export interface NutritionConsultationFilters {
  clientId?: string;
  nutritionistId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class NutritionConsultationService {
  private prisma: PrismaClient;
  private redis: RedisService;

  constructor() {
    this.prisma = getPrismaClient();
    this.redis = new RedisService();
  }

  /**
   * Agenda nova consulta nutricional
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async scheduleConsultation(data: NutritionConsultationCreateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const consultation = await this.prisma.nutritionConsultation.create({
        data: {
          tenantId: data.tenantId,
          clientId: data.clientId,
          nutritionistId: data.nutritionistId,
          scheduledAt: data.scheduledAt,
          duration: data.duration || 60,
          notes: data.notes,
          recommendations: data.recommendations,
          followUpDate: data.followUpDate
        },
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          tenant: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateConsultationCache(data.clientId, data.nutritionistId);

      logger.info(`✅ Nutrition consultation scheduled: ${consultation.id} for ${consultation.client.user.name}`);
      return consultation;
    } catch (error) {
      logger.error('Error scheduling nutrition consultation:', error);
      throw error;
    }
  }

  /**
   * Alias for scheduleConsultation - creates a consultation
   */
  async createConsultation(data: NutritionConsultationCreateInput) {
    return this.scheduleConsultation(data);
  }

  /**
   * Busca consulta por ID com cache
   */
  async getConsultationById(id: string) {
    const cacheKey = `nutrition-consultation:${id}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_MEAL_PLANS || '1800')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Nutrition consultation by ID: ${id}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Nutrition consultation by ID: ${id}`);
      const consultation = await this.prisma.nutritionConsultation.findUnique({
        where: { id },
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          tenant: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // 3. Cachear se encontrado
      if (consultation) {
        await this.redis.set(cacheKey, consultation, {
          namespace: 'nutrition',
          ttl: parseInt(process.env.REDIS_TTL_MEAL_PLANS || '1800')
        });
      }

      return consultation;
    } catch (error) {
      logger.error('Error getting nutrition consultation by ID:', error);
      throw error;
    }
  }

  /**
   * Busca consultas com filtros e cache
   */
  async getConsultations(filters: NutritionConsultationFilters = {}) {
    const cacheKey = this.generateSearchCacheKey(filters);
    
    try {
      // 1. Tentar cache Redis (rápido)
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_MEAL_PLANS || '1800')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Nutrition consultations: ${cacheKey}`);
        return cached;
      }

      // 2. Cache MISS - buscar PostgreSQL (fonte da verdade)
      logger.info(`🗄️ Cache MISS - Nutrition consultations: ${cacheKey}`);
      
      const whereClause = this.buildWhereClause(filters);
      const consultations = await this.prisma.nutritionConsultation.findMany({
        where: whereClause,
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          tenant: {
            select: {
              id: true,
              name: true
            }
          }
        },
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { scheduledAt: 'desc' }
      });

      // 3. Cachear no Redis para próximas requests
      await this.redis.set(cacheKey, consultations, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_MEAL_PLANS || '1800')
      });

      return consultations;
    } catch (error) {
      logger.error('Error getting nutrition consultations:', error);
      throw error;
    }
  }

  /**
   * Busca consultas do cliente
   */
  async getClientConsultations(clientId: string, filters: NutritionConsultationFilters = {}) {
    const clientFilters = { ...filters, clientId };
    return this.getConsultations(clientFilters);
  }

  /**
   * Busca consultas do nutricionista
   */
  async getNutritionistConsultations(nutritionistId: string, filters: NutritionConsultationFilters = {}) {
    const nutritionistFilters = { ...filters, nutritionistId };
    return this.getConsultations(nutritionistFilters);
  }

  /**
   * Busca consultas próximas (próximos 7 dias)
   */
  async getUpcomingConsultations(nutritionistId?: string) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const filters: NutritionConsultationFilters = {
      startDate,
      endDate,
      status: 'scheduled'
    };

    if (nutritionistId) {
      filters.nutritionistId = nutritionistId;
    }

    return this.getConsultations(filters);
  }

  /**
   * Atualiza consulta nutricional
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async updateConsultation(data: NutritionConsultationUpdateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const updateData: any = {};
      
      if (data.scheduledAt) updateData.scheduledAt = data.scheduledAt;
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.recommendations !== undefined) updateData.recommendations = data.recommendations;
      if (data.followUpDate !== undefined) updateData.followUpDate = data.followUpDate;

      const consultation = await this.prisma.nutritionConsultation.update({
        where: { id: data.id },
        data: updateData,
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          tenant: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateConsultationCache(consultation.clientId, consultation.nutritionistId);

      logger.info(`✅ Nutrition consultation updated: ${consultation.id}`);
      return consultation;
    } catch (error) {
      logger.error('Error updating nutrition consultation:', error);
      throw error;
    }
  }

  /**
   * Marca consulta como concluída
   */
  async completeConsultation(id: string, notes?: string, recommendations?: string) {
    try {
      const consultation = await this.prisma.nutritionConsultation.update({
        where: { id },
        data: {
          status: 'completed',
          notes: notes,
          recommendations: recommendations
        },
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          tenant: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Invalidar cache
      await this.invalidateConsultationCache(consultation.clientId, consultation.nutritionistId);

      logger.info(`✅ Nutrition consultation completed: ${consultation.id}`);
      return consultation;
    } catch (error) {
      logger.error('Error completing nutrition consultation:', error);
      throw error;
    }
  }

  /**
   * Cancela consulta nutricional
   */
  async cancelConsultation(id: string, reason?: string) {
    try {
      // Buscar consulta existente primeiro
      const existingConsultation = await this.prisma.nutritionConsultation.findUnique({
        where: { id }
      });

      const consultation = await this.prisma.nutritionConsultation.update({
        where: { id },
        data: {
          status: 'cancelled',
          notes: reason ? `${existingConsultation?.notes || ''}\nCancelada: ${reason}`.trim() : existingConsultation?.notes
        },
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          tenant: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Invalidar cache
      await this.invalidateConsultationCache(consultation.clientId, consultation.nutritionistId);

      logger.info(`✅ Nutrition consultation cancelled: ${consultation.id}`);
      return consultation;
    } catch (error) {
      logger.error('Error cancelling nutrition consultation:', error);
      throw error;
    }
  }

  /**
   * Remove consulta nutricional
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async deleteConsultation(id: string) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const consultation = await this.prisma.nutritionConsultation.delete({
        where: { id }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateConsultationCache(consultation.clientId, consultation.nutritionistId);

      logger.info(`✅ Nutrition consultation deleted: ${consultation.id}`);
      return consultation;
    } catch (error) {
      logger.error('Error deleting nutrition consultation:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas de consultas
   */
  async getConsultationStats(nutritionistId?: string, clientId?: string) {
    const cacheKey = `nutrition-consultation:stats:${nutritionistId || 'all'}:${clientId || 'all'}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: 600 // 10 minutos para stats
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Nutrition consultation stats: ${cacheKey}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Nutrition consultation stats: ${cacheKey}`);
      
      const whereClause: any = {};
      if (nutritionistId) whereClause.nutritionistId = nutritionistId;
      if (clientId) whereClause.clientId = clientId;

      const [
        totalConsultations,
        scheduledConsultations,
        completedConsultations,
        cancelledConsultations,
        upcomingConsultations
      ] = await Promise.all([
        this.prisma.nutritionConsultation.count({
          where: whereClause
        }),
        this.prisma.nutritionConsultation.count({
          where: { ...whereClause, status: 'scheduled' }
        }),
        this.prisma.nutritionConsultation.count({
          where: { ...whereClause, status: 'completed' }
        }),
        this.prisma.nutritionConsultation.count({
          where: { ...whereClause, status: 'cancelled' }
        }),
        this.prisma.nutritionConsultation.count({
          where: { 
            ...whereClause,
            scheduledAt: { gte: new Date() },
            status: 'scheduled'
          }
        })
      ]);

      const stats = {
        total: totalConsultations,
        scheduled: scheduledConsultations,
        completed: completedConsultations,
        cancelled: cancelledConsultations,
        upcoming: upcomingConsultations,
        completionRate: totalConsultations > 0 ? Math.round((completedConsultations / totalConsultations) * 100) : 0
      };

      // 3. Cachear
      await this.redis.set(cacheKey, stats, {
        namespace: 'nutrition',
        ttl: 600 // 10 minutos
      });

      return stats;
    } catch (error) {
      logger.error('Error getting nutrition consultation stats:', error);
      throw error;
    }
  }

  /**
   * Gera chave de cache para busca
   */
  private generateSearchCacheKey(filters: NutritionConsultationFilters): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key as keyof NutritionConsultationFilters]}`)
      .join('|');
    
    return `nutrition-consultation:search:${sortedFilters}`;
  }

  /**
   * Constrói cláusula WHERE para busca
   */
  private buildWhereClause(filters: NutritionConsultationFilters) {
    const where: any = {};

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.nutritionistId) {
      where.nutritionistId = filters.nutritionistId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.scheduledAt = {};
      if (filters.startDate) {
        where.scheduledAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.scheduledAt.lte = filters.endDate;
      }
    }

    return where;
  }

  /**
   * Invalida cache de consultas nutricionais
   */
  private async invalidateConsultationCache(clientId?: string, nutritionistId?: string) {
    try {
      // Invalidar cache específico
      if (clientId) {
        await this.redis.invalidatePattern(`nutrition-consultation:*clientId:${clientId}*`, { namespace: 'nutrition' });
      }
      if (nutritionistId) {
        await this.redis.invalidatePattern(`nutrition-consultation:*nutritionistId:${nutritionistId}*`, { namespace: 'nutrition' });
      }

      // Invalidar cache geral
      await this.redis.invalidatePattern('nutrition-consultation:search:*', { namespace: 'nutrition' });
      await this.redis.invalidatePattern('nutrition-consultation:stats:*', { namespace: 'nutrition' });

      logger.info('🗑️ Nutrition consultation cache invalidated');
    } catch (error) {
      logger.error('Error invalidating nutrition consultation cache:', error);
      // Não falhar se cache invalidation falhar
    }
  }

  /**
   * Health check do service
   */
  async healthCheck() {
    try {
      // Testar PostgreSQL
      await this.prisma.nutritionConsultation.count();
      
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
export const nutritionConsultationService = new NutritionConsultationService();
