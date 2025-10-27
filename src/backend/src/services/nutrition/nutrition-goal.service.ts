/**
 * Nutrition Goal Service - FitOS Sprint 4
 * 
 * Gerencia objetivos nutricionais dos clientes com cache Redis para performance.
 * 
 * Pattern: PostgreSQL (fonte da verdade) + Redis (cache opcional)
 */

import { PrismaClient } from '@prisma/client';
import { RedisService } from '../redis.service';
import { logger } from '../../utils/logger';

export interface NutritionGoalCreateInput {
  tenantId: string;
  clientId: string;
  type: string; // weight_loss, weight_gain, muscle_gain, maintenance
  targetValue?: number;
  currentValue?: number;
  unit: string;
  targetDate?: Date;
}

export interface NutritionGoalUpdateInput extends Partial<NutritionGoalCreateInput> {
  id: string;
}

export interface NutritionGoalFilters {
  clientId: string;
  type?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface GoalProgress {
  goalId: string;
  type: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  progressPercentage: number;
  daysRemaining?: number;
  isOnTrack: boolean;
  estimatedCompletionDate?: Date;
}

export class NutritionGoalService {
  private prisma: PrismaClient;
  private redis: RedisService;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new RedisService();
  }

  /**
   * Cria novo objetivo nutricional
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async createGoal(data: NutritionGoalCreateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const goal = await this.prisma.nutritionGoal.create({
        data: {
          tenantId: data.tenantId,
          clientId: data.clientId,
          type: data.type,
          targetValue: data.targetValue,
          currentValue: data.currentValue,
          unit: data.unit,
          targetDate: data.targetDate
        },
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
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
      await this.invalidateGoalCache(data.clientId);

      logger.info(`✅ Nutrition goal created: ${goal.type} for ${goal.client.user.name} (${goal.id})`);
      return goal;
    } catch (error) {
      logger.error('Error creating nutrition goal:', error);
      throw error;
    }
  }

  /**
   * Alias for createGoal - creates a nutrition goal
   */
  async createNutritionGoal(data: NutritionGoalCreateInput) {
    return this.createGoal(data);
  }

  /**
   * Busca objetivo por ID com cache
   */
  async getGoalById(id: string) {
    const cacheKey = `nutrition-goal:${id}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_NUTRITION_PROFILES || '3600')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Nutrition goal by ID: ${id}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Nutrition goal by ID: ${id}`);
      const goal = await this.prisma.nutritionGoal.findUnique({
        where: { id },
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
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
      if (goal) {
        await this.redis.set(cacheKey, goal, {
          namespace: 'nutrition',
          ttl: parseInt(process.env.REDIS_TTL_NUTRITION_PROFILES || '3600')
        });
      }

      return goal;
    } catch (error) {
      logger.error('Error getting nutrition goal by ID:', error);
      throw error;
    }
  }

  /**
   * Alias for getGoalById - gets a nutrition goal by ID
   */
  async getNutritionGoalById(id: string) {
    return this.getGoalById(id);
  }

  /**
   * Busca objetivos do cliente com filtros e cache
   */
  async getClientGoals(filters: NutritionGoalFilters) {
    const cacheKey = this.generateSearchCacheKey(filters);
    
    try {
      // 1. Tentar cache Redis (rápido)
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_NUTRITION_PROFILES || '3600')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Client nutrition goals: ${cacheKey}`);
        return cached;
      }

      // 2. Cache MISS - buscar PostgreSQL (fonte da verdade)
      logger.info(`🗄️ Cache MISS - Client nutrition goals: ${cacheKey}`);
      
      const whereClause = this.buildWhereClause(filters);
      const goals = await this.prisma.nutritionGoal.findMany({
        where: whereClause,
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
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
        orderBy: { createdAt: 'desc' }
      });

      // 3. Cachear no Redis para próximas requests
      await this.redis.set(cacheKey, goals, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_NUTRITION_PROFILES || '3600')
      });

      return goals;
    } catch (error) {
      logger.error('Error getting client nutrition goals:', error);
      throw error;
    }
  }

  /**
   * Busca objetivos ativos do cliente
   */
  async getActiveClientGoals(clientId: string) {
    return this.getClientGoals({
      clientId,
      isActive: true
    });
  }

  /**
   * Alias for getClientGoals - gets nutrition goals
   */
  async getNutritionGoals(filters: NutritionGoalFilters) {
    return this.getClientGoals(filters);
  }

  /**
   * Calcula estatísticas de metas nutricionais
   */
  async getNutritionGoalStats(tenantId: string) {
    try {
      const goals = await this.prisma.nutritionGoal.findMany({
        where: { tenantId },
        select: {
          type: true,
          isActive: true,
          currentValue: true,
          targetValue: true
        }
      });

      const total = goals.length;
      const active = goals.filter(g => g.isActive).length;
      const completed = goals.filter(g => 
        g.currentValue !== null && 
        g.targetValue !== null && 
        g.currentValue >= g.targetValue
      ).length;

      const byType = goals.reduce((acc: Record<string, number>, goal) => {
        acc[goal.type] = (acc[goal.type] || 0) + 1;
        return acc;
      }, {});

      return {
        total,
        active,
        completed,
        byType
      };
    } catch (error) {
      logger.error('Error getting nutrition goal stats:', error);
      throw error;
    }
  }

  /**
   * Atualiza objetivo nutricional
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async updateGoal(data: NutritionGoalUpdateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const updateData: any = {};
      
      if (data.type) updateData.type = data.type;
      if (data.targetValue !== undefined) updateData.targetValue = data.targetValue;
      if (data.currentValue !== undefined) updateData.currentValue = data.currentValue;
      if (data.unit) updateData.unit = data.unit;
      if (data.targetDate !== undefined) updateData.targetDate = data.targetDate;

      const goal = await this.prisma.nutritionGoal.update({
        where: { id: data.id },
        data: updateData,
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
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
      await this.invalidateGoalCache(goal.clientId);

      logger.info(`✅ Nutrition goal updated: ${goal.type} (${goal.id})`);
      return goal;
    } catch (error) {
      logger.error('Error updating nutrition goal:', error);
      throw error;
    }
  }

  /**
   * Alias for updateGoal - updates a nutrition goal
   */
  async updateNutritionGoal(data: NutritionGoalUpdateInput) {
    return this.updateGoal(data);
  }

  /**
   * Ativa/desativa objetivo nutricional
   */
  async toggleGoalStatus(id: string, isActive: boolean) {
    try {
      const goal = await this.prisma.nutritionGoal.update({
        where: { id },
        data: { isActive }
      });

      // Invalidar cache
      await this.invalidateGoalCache(goal.clientId);

      logger.info(`✅ Nutrition goal status updated: ${goal.type} (${goal.id}) - Active: ${isActive}`);
      return goal;
    } catch (error) {
      logger.error('Error toggling nutrition goal status:', error);
      throw error;
    }
  }

  /**
   * Remove objetivo nutricional
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async deleteGoal(id: string) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const goal = await this.prisma.nutritionGoal.delete({
        where: { id }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateGoalCache(goal.clientId);

      logger.info(`✅ Nutrition goal deleted: ${goal.type} (${goal.id})`);
      return goal;
    } catch (error) {
      logger.error('Error deleting nutrition goal:', error);
      throw error;
    }
  }

  /**
   * Alias for deleteGoal - deletes a nutrition goal
   */
  async deleteNutritionGoal(id: string) {
    return this.deleteGoal(id);
  }

  /**
   * Calcula progresso do objetivo
   */
  calculateGoalProgress(goal: any): GoalProgress {
    const currentValue = goal.currentValue || 0;
    const targetValue = goal.targetValue || 0;
    
    let progressPercentage = 0;
    let isOnTrack = true;
    let estimatedCompletionDate: Date | undefined;

    if (targetValue > 0) {
      if (goal.type === 'weight_loss') {
        // Para perda de peso, progresso é baseado na diferença entre valor inicial e atual
        const initialValue = goal.currentValue || 0;
        const totalLoss = initialValue - targetValue;
        const currentLoss = initialValue - currentValue;
        progressPercentage = totalLoss > 0 ? Math.min((currentLoss / totalLoss) * 100, 100) : 0;
      } else if (goal.type === 'weight_gain' || goal.type === 'muscle_gain') {
        // Para ganho de peso/massa, progresso é baseado no aumento
        const initialValue = goal.currentValue || 0;
        const totalGain = targetValue - initialValue;
        const currentGain = currentValue - initialValue;
        progressPercentage = totalGain > 0 ? Math.min((currentGain / totalGain) * 100, 100) : 0;
      } else {
        // Para manutenção, progresso é baseado na proximidade do alvo
        const difference = Math.abs(currentValue - targetValue);
        const tolerance = targetValue * 0.05; // 5% de tolerância
        progressPercentage = difference <= tolerance ? 100 : Math.max(0, 100 - (difference / targetValue) * 100);
      }
    }

    // Calcular dias restantes se data alvo estiver definida
    let daysRemaining: number | undefined;
    if (goal.targetDate) {
      const now = new Date();
      const targetDate = new Date(goal.targetDate);
      daysRemaining = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Estimar data de conclusão baseada no progresso atual
      if (progressPercentage > 0 && progressPercentage < 100 && daysRemaining > 0) {
        const estimatedDays = Math.ceil((daysRemaining * (100 - progressPercentage)) / progressPercentage);
        estimatedCompletionDate = new Date(now.getTime() + (estimatedDays * 24 * 60 * 60 * 1000));
      }
    }

    // Determinar se está no caminho certo
    if (goal.targetDate && daysRemaining !== undefined) {
      const expectedProgress = Math.max(0, 100 - (daysRemaining / 30) * 100); // Assumindo 30 dias como período padrão
      isOnTrack = progressPercentage >= expectedProgress * 0.8; // 80% do progresso esperado
    }

    return {
      goalId: goal.id,
      type: goal.type,
      currentValue,
      targetValue,
      unit: goal.unit,
      progressPercentage: Math.round(progressPercentage * 100) / 100,
      daysRemaining,
      isOnTrack,
      estimatedCompletionDate
    };
  }

  /**
   * Busca progresso de todos os objetivos do cliente
   */
  async getClientGoalProgress(clientId: string) {
    const cacheKey = `nutrition-goal:progress:${clientId}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: 300 // 5 minutos para progresso
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Client goal progress: ${clientId}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Client goal progress: ${clientId}`);
      
      const goals = await this.getActiveClientGoals(clientId);
      const progress = goals.map(goal => this.calculateGoalProgress(goal));

      // 3. Cachear
      await this.redis.set(cacheKey, progress, {
        namespace: 'nutrition',
        ttl: 300 // 5 minutos
      });

      return progress;
    } catch (error) {
      logger.error('Error getting client goal progress:', error);
      throw error;
    }
  }

  /**
   * Atualiza valor atual do objetivo
   */
  async updateCurrentValue(goalId: string, currentValue: number) {
    try {
      const goal = await this.prisma.nutritionGoal.update({
        where: { id: goalId },
        data: { currentValue }
      });

      // Invalidar cache
      await this.invalidateGoalCache(goal.clientId);

      logger.info(`✅ Nutrition goal current value updated: ${goal.type} (${goal.id}) - Value: ${currentValue}`);
      return goal;
    } catch (error) {
      logger.error('Error updating nutrition goal current value:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas de objetivos
   */
  async getGoalStats(clientId: string) {
    const cacheKey = `nutrition-goal:stats:${clientId}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: 600 // 10 minutos para stats
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Nutrition goal stats: ${clientId}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Nutrition goal stats: ${clientId}`);
      
      const [
        totalGoals,
        activeGoals,
        completedGoals,
        weightLossGoals,
        weightGainGoals,
        muscleGainGoals,
        maintenanceGoals
      ] = await Promise.all([
        this.prisma.nutritionGoal.count({
          where: { clientId }
        }),
        this.prisma.nutritionGoal.count({
          where: { clientId, isActive: true }
        }),
        this.prisma.nutritionGoal.count({
          where: { 
            clientId,
            isActive: false,
            targetDate: { lt: new Date() }
          }
        }),
        this.prisma.nutritionGoal.count({
          where: { clientId, type: 'weight_loss' }
        }),
        this.prisma.nutritionGoal.count({
          where: { clientId, type: 'weight_gain' }
        }),
        this.prisma.nutritionGoal.count({
          where: { clientId, type: 'muscle_gain' }
        }),
        this.prisma.nutritionGoal.count({
          where: { clientId, type: 'maintenance' }
        })
      ]);

      const stats = {
        total: totalGoals,
        active: activeGoals,
        completed: completedGoals,
        byType: {
          weightLoss: weightLossGoals,
          weightGain: weightGainGoals,
          muscleGain: muscleGainGoals,
          maintenance: maintenanceGoals
        },
        completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0
      };

      // 3. Cachear
      await this.redis.set(cacheKey, stats, {
        namespace: 'nutrition',
        ttl: 600 // 10 minutos
      });

      return stats;
    } catch (error) {
      logger.error('Error getting nutrition goal stats:', error);
      throw error;
    }
  }

  /**
   * Gera chave de cache para busca
   */
  private generateSearchCacheKey(filters: NutritionGoalFilters): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key as keyof NutritionGoalFilters]}`)
      .join('|');
    
    return `nutrition-goal:search:${sortedFilters}`;
  }

  /**
   * Constrói cláusula WHERE para busca
   */
  private buildWhereClause(filters: NutritionGoalFilters) {
    const where: any = {
      clientId: filters.clientId
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return where;
  }

  /**
   * Invalida cache de objetivos nutricionais
   */
  private async invalidateGoalCache(clientId: string) {
    try {
      // Invalidar cache específico do cliente
      await this.redis.invalidatePattern(`nutrition-goal:*clientId:${clientId}*`, { namespace: 'nutrition' });
      await this.redis.del(`nutrition-goal:progress:${clientId}`, { namespace: 'nutrition' });
      await this.redis.del(`nutrition-goal:stats:${clientId}`, { namespace: 'nutrition' });

      // Invalidar cache geral
      await this.redis.invalidatePattern('nutrition-goal:search:*', { namespace: 'nutrition' });

      logger.info('🗑️ Nutrition goal cache invalidated');
    } catch (error) {
      logger.error('Error invalidating nutrition goal cache:', error);
      // Não falhar se cache invalidation falhar
    }
  }

  /**
   * Health check do service
   */
  async healthCheck() {
    try {
      // Testar PostgreSQL
      await this.prisma.nutritionGoal.count();
      
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
export const nutritionGoalService = new NutritionGoalService();
