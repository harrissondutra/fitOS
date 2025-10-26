/**
 * Meal Plan Service - FitOS Sprint 4
 * 
 * Gerencia planos alimentares com cache Redis para performance.
 * 
 * Pattern: PostgreSQL (fonte da verdade) + Redis (cache opcional)
 */

import { PrismaClient } from '@prisma/client';
import { RedisService } from '../redis.service';
import { logger } from '../../utils/logger';
import { foodDatabaseService } from './food-database.service';

export interface MealPlanCreateInput {
  tenantId: string;
  clientId: string;
  nutritionistId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  meals: MealInput[];
}

export interface MealInput {
  name: string;
  mealType: string; // breakfast, lunch, dinner, snack
  order: number;
  items: MealItemInput[];
}

export interface MealItemInput {
  foodId?: string;
  recipeId?: string;
  name: string;
  quantity: number;
  unit: string;
  order: number;
}

export interface MealPlanUpdateInput extends Partial<MealPlanCreateInput> {
  id: string;
}

export class MealPlanService {
  private prisma: PrismaClient;
  private redis: RedisService;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new RedisService();
  }

  /**
   * Cria novo plano alimentar
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async createMealPlan(data: MealPlanCreateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const mealPlan = await this.prisma.mealPlan.create({
        data: {
          tenantId: data.tenantId,
          clientId: data.clientId,
          nutritionistId: data.nutritionistId,
          name: data.name,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          meals: {
            create: data.meals.map(meal => ({
              name: meal.name,
              mealType: meal.mealType,
              order: meal.order,
              mealItems: {
                create: meal.items.map(item => ({
                  foodId: item.foodId,
                  recipeId: item.recipeId,
                  name: item.name,
                  quantity: item.quantity,
                  unit: item.unit,
                  order: item.order
                }))
              }
            }))
          }
        },
        include: {
          meals: {
            include: {
              mealItems: {
                include: {
                  food: true,
                  recipe: true
                }
              }
            },
            orderBy: { order: 'asc' }
          },
          client: {
            include: {
              user: true
            }
          },
          nutritionist: {
            include: {
              user: true
            }
          }
        }
      });

      // 2. Calcular macros totais
      const calculatedPlan = await this.calculateMealPlanMacros(mealPlan);

      // 3. Atualizar com macros calculados
      const updatedPlan = await this.prisma.mealPlan.update({
        where: { id: calculatedPlan.id },
        data: {
          totalCalories: calculatedPlan.totalCalories,
          totalProtein: calculatedPlan.totalProtein,
          totalCarbs: calculatedPlan.totalCarbs,
          totalFat: calculatedPlan.totalFat,
          totalFiber: calculatedPlan.totalFiber
        },
        include: {
          meals: {
            include: {
              mealItems: {
                include: {
                  food: true,
                  recipe: true
                }
              }
            },
            orderBy: { order: 'asc' }
          },
          client: {
            include: {
              user: true
            }
          },
          nutritionist: {
            include: {
              user: true
            }
          }
        }
      });

      // 4. INVALIDAR cache Redis
      await this.invalidateMealPlanCache(data.clientId);

      logger.info(`✅ Meal plan created: ${updatedPlan.name} (${updatedPlan.id})`);
      return updatedPlan;
    } catch (error) {
      logger.error('Error creating meal plan:', error);
      throw error;
    }
  }

  /**
   * Busca plano alimentar por ID com cache
   */
  async getMealPlanById(id: string) {
    const cacheKey = `meal-plan:${id}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_MEAL_PLANS || '1800')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Meal plan by ID: ${id}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Meal plan by ID: ${id}`);
      const mealPlan = await this.prisma.mealPlan.findUnique({
        where: { id },
        include: {
          meals: {
            include: {
              mealItems: {
                include: {
                  food: true,
                  recipe: true
                }
              }
            },
            orderBy: { order: 'asc' }
          },
          client: {
            include: {
              user: true
            }
          },
          nutritionist: {
            include: {
              user: true
            }
          }
        }
      });

      // 3. Cachear se encontrado
      if (mealPlan) {
        await this.redis.set(cacheKey, mealPlan, {
          namespace: 'nutrition',
          ttl: parseInt(process.env.REDIS_TTL_MEAL_PLANS || '1800')
        });
      }

      return mealPlan;
    } catch (error) {
      logger.error('Error getting meal plan by ID:', error);
      throw error;
    }
  }

  /**
   * Busca planos alimentares do cliente com cache
   */
  async getClientMealPlans(clientId: string, activeOnly: boolean = true) {
    const cacheKey = `meal-plan:client:${clientId}:${activeOnly}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_MEAL_PLANS || '1800')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Client meal plans: ${clientId}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Client meal plans: ${clientId}`);
      const mealPlans = await this.prisma.mealPlan.findMany({
        where: {
          clientId,
          ...(activeOnly && { isActive: true })
        },
        include: {
          meals: {
            include: {
              mealItems: {
                include: {
                  food: true,
                  recipe: true
                }
              }
            },
            orderBy: { order: 'asc' }
          },
          client: {
            include: {
              user: true
            }
          },
          nutritionist: {
            include: {
              user: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // 3. Cachear
      await this.redis.set(cacheKey, mealPlans, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_MEAL_PLANS || '1800')
      });

      return mealPlans;
    } catch (error) {
      logger.error('Error getting client meal plans:', error);
      throw error;
    }
  }

  /**
   * Busca plano alimentar ativo do cliente para hoje
   */
  async getTodaysMealPlan(clientId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const cacheKey = `meal-plan:client:${clientId}:today:${today.toISOString().split('T')[0]}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_MEAL_PLANS || '1800')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Today's meal plan: ${clientId}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Today's meal plan: ${clientId}`);
      const mealPlan = await this.prisma.mealPlan.findFirst({
        where: {
          clientId,
          isActive: true,
          startDate: { lte: today },
          OR: [
            { endDate: null },
            { endDate: { gte: today } }
          ]
        },
        include: {
          meals: {
            include: {
              mealItems: {
                include: {
                  food: true,
                  recipe: true
                }
              }
            },
            orderBy: { order: 'asc' }
          },
          client: {
            include: {
              user: true
            }
          },
          nutritionist: {
            include: {
              user: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // 3. Cachear se encontrado
      if (mealPlan) {
        await this.redis.set(cacheKey, mealPlan, {
          namespace: 'nutrition',
          ttl: parseInt(process.env.REDIS_TTL_MEAL_PLANS || '1800')
        });
      }

      return mealPlan;
    } catch (error) {
      logger.error('Error getting today\'s meal plan:', error);
      throw error;
    }
  }

  /**
   * Atualiza plano alimentar
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async updateMealPlan(data: MealPlanUpdateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const updateData: any = {};
      
      if (data.name) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.startDate) updateData.startDate = data.startDate;
      if (data.endDate !== undefined) updateData.endDate = data.endDate;

      const mealPlan = await this.prisma.mealPlan.update({
        where: { id: data.id },
        data: updateData,
        include: {
          meals: {
            include: {
              mealItems: {
                include: {
                  food: true,
                  recipe: true
                }
              }
            },
            orderBy: { order: 'asc' }
          },
          client: {
            include: {
              user: true
            }
          },
          nutritionist: {
            include: {
              user: true
            }
          }
        }
      });

      // 2. Recalcular macros se necessário
      const calculatedPlan = await this.calculateMealPlanMacros(mealPlan);
      
      const updatedPlan = await this.prisma.mealPlan.update({
        where: { id: calculatedPlan.id },
        data: {
          totalCalories: calculatedPlan.totalCalories,
          totalProtein: calculatedPlan.totalProtein,
          totalCarbs: calculatedPlan.totalCarbs,
          totalFat: calculatedPlan.totalFat,
          totalFiber: calculatedPlan.totalFiber
        },
        include: {
          meals: {
            include: {
              mealItems: {
                include: {
                  food: true,
                  recipe: true
                }
              }
            },
            orderBy: { order: 'asc' }
          },
          client: {
            include: {
              user: true
            }
          },
          nutritionist: {
            include: {
              user: true
            }
          }
        }
      });

      // 3. INVALIDAR cache Redis
      await this.invalidateMealPlanCache(mealPlan.clientId);

      logger.info(`✅ Meal plan updated: ${updatedPlan.name} (${updatedPlan.id})`);
      return updatedPlan;
    } catch (error) {
      logger.error('Error updating meal plan:', error);
      throw error;
    }
  }

  /**
   * Ativa/desativa plano alimentar
   */
  async toggleMealPlanStatus(id: string, isActive: boolean) {
    try {
      const mealPlan = await this.prisma.mealPlan.update({
        where: { id },
        data: { isActive }
      });

      // Invalidar cache
      await this.invalidateMealPlanCache(mealPlan.clientId);

      logger.info(`✅ Meal plan status updated: ${mealPlan.name} (${mealPlan.id}) - Active: ${isActive}`);
      return mealPlan;
    } catch (error) {
      logger.error('Error toggling meal plan status:', error);
      throw error;
    }
  }

  /**
   * Remove plano alimentar
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async deleteMealPlan(id: string) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const mealPlan = await this.prisma.mealPlan.delete({
        where: { id }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateMealPlanCache(mealPlan.clientId);

      logger.info(`✅ Meal plan deleted: ${mealPlan.name} (${mealPlan.id})`);
      return mealPlan;
    } catch (error) {
      logger.error('Error deleting meal plan:', error);
      throw error;
    }
  }

  /**
   * Calcula macros nutricionais do plano alimentar
   */
  async calculateMealPlanMacros(mealPlan: any) {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    for (const meal of mealPlan.meals) {
      for (const item of meal.mealItems) {
        if (item.food) {
          const macros = foodDatabaseService.calculateMacros(
            item.food,
            item.quantity,
            item.unit
          );
          
          totalCalories += macros.calories;
          totalProtein += macros.protein;
          totalCarbs += macros.carbs;
          totalFat += macros.fat;
          totalFiber += macros.fiber;
        } else if (item.recipe) {
          // Calcular macros da receita (implementar se necessário)
          // Por enquanto, usar valores diretos se disponíveis
          if (item.recipe.calories) totalCalories += item.recipe.calories;
          if (item.recipe.protein) totalProtein += item.recipe.protein;
          if (item.recipe.carbs) totalCarbs += item.recipe.carbs;
          if (item.recipe.fat) totalFat += item.recipe.fat;
          if (item.recipe.fiber) totalFiber += item.recipe.fiber;
        }
      }
    }

    return {
      ...mealPlan,
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein * 100) / 100,
      totalCarbs: Math.round(totalCarbs * 100) / 100,
      totalFat: Math.round(totalFat * 100) / 100,
      totalFiber: Math.round(totalFiber * 100) / 100
    };
  }

  /**
   * Invalida cache de planos alimentares
   */
  private async invalidateMealPlanCache(clientId?: string) {
    try {
      if (clientId) {
        // Invalidar cache específico do cliente
        await this.redis.invalidatePattern(`meal-plan:client:${clientId}:*`, { namespace: 'nutrition' });
        await this.redis.invalidatePattern(`meal-plan:client:${clientId}:today:*`, { namespace: 'nutrition' });
      }

      // Invalidar cache geral
      await this.redis.invalidatePattern('meal-plan:*', { namespace: 'nutrition' });

      logger.info('🗑️ Meal plan cache invalidated');
    } catch (error) {
      logger.error('Error invalidating meal plan cache:', error);
      // Não falhar se cache invalidation falhar
    }
  }

  /**
   * Health check do service
   */
  async healthCheck() {
    try {
      // Testar PostgreSQL
      await this.prisma.mealPlan.count();
      
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
export const mealPlanService = new MealPlanService();
