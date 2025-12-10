/**
 * Food Diary Service - FitOS Sprint 4
 * 
 * Gerencia diário alimentar dos clientes com cache Redis para performance.
 * 
 * Pattern: PostgreSQL (fonte da verdade) + Redis (cache opcional)
 */

import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../config/database';
import { RedisService } from '../redis.service';
import { logger } from '../../utils/logger';
import { foodDatabaseService } from './food-database.service';

export interface FoodDiaryEntryCreateInput {
  tenantId: string;
  clientId: string;
  foodId?: string;
  recipeId?: string;
  name: string;
  quantity: number;
  unit: string;
  mealType: string; // breakfast, lunch, dinner, snack
  consumedAt: Date;
  notes?: string;
}

export interface FoodDiaryEntryUpdateInput extends Partial<FoodDiaryEntryCreateInput> {
  id: string;
}

export interface FoodDiaryFilters {
  clientId: string;
  date?: Date;
  startDate?: Date;
  endDate?: Date;
  mealType?: string;
  limit?: number;
  offset?: number;
}

export interface DailyNutritionSummary {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  meals: {
    mealType: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    entries: any[];
  }[];
}

export class FoodDiaryService {
  private prisma: PrismaClient;
  private redis: RedisService;

  constructor() {
    this.prisma = getPrismaClient();
    this.redis = new RedisService();
  }

  /**
   * Adiciona entrada no diário alimentar
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async addEntry(data: FoodDiaryEntryCreateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const entry = await this.prisma.foodDiaryEntry.create({
        data: {
          tenantId: data.tenantId,
          clientId: data.clientId,
          food: data.name, // O campo 'food' é String
          quantity: data.quantity,
          unit: data.unit,
          mealType: data.mealType,
          consumedAt: data.consumedAt,
          calories: 0 // Inicial com 0, será calculado depois
        }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateDiaryCache(data.clientId, data.consumedAt);

      logger.info(`✅ Food diary entry added: ${entry.food} (${entry.id})`);
      return entry;
    } catch (error) {
      logger.error('Error adding food diary entry:', error);
      throw error;
    }
  }

  /**
   * Alias for addEntry - creates a food diary entry
   */
  async createFoodDiaryEntry(data: FoodDiaryEntryCreateInput) {
    return this.addEntry(data);
  }

  /**
   * Busca entradas do diário com filtros e cache
   */
  async getEntries(filters: FoodDiaryFilters) {
    const cacheKey = this.generateEntriesCacheKey(filters);
    
    try {
      // 1. Tentar cache Redis (rápido)
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_DIARY_ENTRIES || '300')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Food diary entries: ${cacheKey}`);
        return cached;
      }

      // 2. Cache MISS - buscar PostgreSQL (fonte da verdade)
      logger.info(`🗄️ Cache MISS - Food diary entries: ${cacheKey}`);
      
      const whereClause = this.buildWhereClause(filters);
      const entries = await this.prisma.foodDiaryEntry.findMany({
        where: whereClause,
        take: filters.limit || 50,
        skip: filters.offset || 0,
        orderBy: { consumedAt: 'desc' }
      });

      // 3. Cachear no Redis para próximas requests
      await this.redis.set(cacheKey, entries, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_DIARY_ENTRIES || '300')
      });

      return entries;
    } catch (error) {
      logger.error('Error getting food diary entries:', error);
      throw error;
    }
  }

  /**
   * Alias for getEntries - gets food diary entries
   */
  async getFoodDiaryEntries(filters: FoodDiaryFilters) {
    return this.getEntries(filters);
  }

  /**
   * Busca entradas do dia específico
   */
  async getDayEntries(clientId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getEntries({
      clientId,
      startDate: startOfDay,
      endDate: endOfDay
    });
  }

  /**
   * Busca resumo nutricional do dia
   */
  async getDailyNutritionSummary(clientId: string, date: Date): Promise<DailyNutritionSummary> {
    const dateStr = date.toISOString().split('T')[0];
    const cacheKey = `food-diary:summary:${clientId}:${dateStr}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_DIARY_ENTRIES || '300')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Daily nutrition summary: ${clientId}:${dateStr}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Daily nutrition summary: ${clientId}:${dateStr}`);
      
      const entries = await this.getDayEntries(clientId, date);
      
      // 3. Agrupar por tipo de refeição e calcular macros
      const mealGroups: { [key: string]: any[] } = {};
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let totalFiber = 0;

      entries.forEach(entry => {
        if (!mealGroups[entry.mealType]) {
          mealGroups[entry.mealType] = [];
        }
        mealGroups[entry.mealType].push(entry);

        // Somar macros
        if (entry.calories) totalCalories += entry.calories;
        if (entry.protein) totalProtein += entry.protein;
        if (entry.carbs) totalCarbs += entry.carbs;
        if (entry.fat) totalFat += entry.fat;
        if (entry.fiber) totalFiber += entry.fiber;
      });

      // 4. Calcular macros por refeição
      const meals = Object.keys(mealGroups).map(mealType => {
        const mealEntries = mealGroups[mealType];
        let mealCalories = 0;
        let mealProtein = 0;
        let mealCarbs = 0;
        let mealFat = 0;
        let mealFiber = 0;

        mealEntries.forEach(entry => {
          if (entry.calories) mealCalories += entry.calories;
          if (entry.protein) mealProtein += entry.protein;
          if (entry.carbs) mealCarbs += entry.carbs;
          if (entry.fat) mealFat += entry.fat;
          if (entry.fiber) mealFiber += entry.fiber;
        });

        return {
          mealType,
          calories: Math.round(mealCalories),
          protein: Math.round(mealProtein * 100) / 100,
          carbs: Math.round(mealCarbs * 100) / 100,
          fat: Math.round(mealFat * 100) / 100,
          fiber: Math.round(mealFiber * 100) / 100,
          entries: mealEntries
        };
      });

      const summary: DailyNutritionSummary = {
        date: dateStr,
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein * 100) / 100,
        totalCarbs: Math.round(totalCarbs * 100) / 100,
        totalFat: Math.round(totalFat * 100) / 100,
        totalFiber: Math.round(totalFiber * 100) / 100,
        meals
      };

      // 5. Cachear
      await this.redis.set(cacheKey, summary, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_DIARY_ENTRIES || '300')
      });

      return summary;
    } catch (error) {
      logger.error('Error getting daily nutrition summary:', error);
      throw error;
    }
  }

  /**
   * Atualiza entrada do diário
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async updateEntry(data: FoodDiaryEntryUpdateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const updateData: any = {};
      
      if (data.name) updateData.food = data.name; // Mapear name para food
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.unit) updateData.unit = data.unit;
      if (data.mealType) updateData.mealType = data.mealType;
      if (data.consumedAt) updateData.consumedAt = data.consumedAt;

      const entry = await this.prisma.foodDiaryEntry.update({
        where: { id: data.id },
        data: updateData
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateDiaryCache(entry.clientId, entry.consumedAt);

      logger.info(`✅ Food diary entry updated: ${entry.food} (${entry.id})`);
      return entry;
    } catch (error) {
      logger.error('Error updating food diary entry:', error);
      throw error;
    }
  }

  /**
   * Alias for updateEntry - updates a food diary entry
   */
  async updateFoodDiaryEntry(data: FoodDiaryEntryUpdateInput) {
    return this.updateEntry(data);
  }

  /**
   * Remove entrada do diário
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async deleteEntry(id: string) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const entry = await this.prisma.foodDiaryEntry.delete({
        where: { id }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateDiaryCache(entry.clientId, entry.consumedAt);

      logger.info(`✅ Food diary entry deleted: ${entry.food} (${entry.id})`);
      return entry;
    } catch (error) {
      logger.error('Error deleting food diary entry:', error);
      throw error;
    }
  }

  /**
   * Alias for deleteEntry - deletes a food diary entry
   */
  async deleteFoodDiaryEntry(id: string) {
    return this.deleteEntry(id);
  }

  /**
   * Busca estatísticas do cliente
   */
  async getClientStats(clientId: string, days: number = 30) {
    const cacheKey = `food-diary:stats:${clientId}:${days}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: 600 // 10 minutos para stats
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Client food diary stats: ${clientId}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Client food diary stats: ${clientId}`);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const entries = await this.prisma.foodDiaryEntry.findMany({
        where: {
          clientId,
          consumedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // 3. Calcular estatísticas
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let totalFiber = 0;
      let totalEntries = entries.length;
      let uniqueFoods = new Set();
      let mealTypeCounts: { [key: string]: number } = {};

      entries.forEach(entry => {
        if (entry.calories) totalCalories += entry.calories;
        
        if (entry.food) uniqueFoods.add(entry.food);
        
        mealTypeCounts[entry.mealType] = (mealTypeCounts[entry.mealType] || 0) + 1;
      });

      const stats = {
        period: { startDate, endDate, days },
        totals: {
          calories: Math.round(totalCalories),
          protein: Math.round(totalProtein * 100) / 100,
          carbs: Math.round(totalCarbs * 100) / 100,
          fat: Math.round(totalFat * 100) / 100,
          fiber: Math.round(totalFiber * 100) / 100
        },
        averages: {
          caloriesPerDay: Math.round(totalCalories / days),
          proteinPerDay: Math.round((totalProtein / days) * 100) / 100,
          carbsPerDay: Math.round((totalCarbs / days) * 100) / 100,
          fatPerDay: Math.round((totalFat / days) * 100) / 100,
          fiberPerDay: Math.round((totalFiber / days) * 100) / 100,
          entriesPerDay: Math.round((totalEntries / days) * 100) / 100
        },
        counts: {
          totalEntries,
          uniqueFoods: uniqueFoods.size,
          mealTypeCounts
        }
      };

      // 4. Cachear
      await this.redis.set(cacheKey, stats, {
        namespace: 'nutrition',
        ttl: 600 // 10 minutos
      });

      return stats;
    } catch (error) {
      logger.error('Error getting client food diary stats:', error);
      throw error;
    }
  }

  /**
   * Calcula estatísticas gerais do diário alimentar
   */
  async getFoodDiaryStats(tenantId: string) {
    try {
      const entries = await this.prisma.foodDiaryEntry.findMany({
        where: { tenantId },
        select: {
          calories: true,
          mealType: true,
          consumedAt: true
        }
      });

      const total = entries.length;
      const totalCalories = entries.reduce((sum, e) => sum + (e.calories || 0), 0);
      
      const mealTypeCounts = entries.reduce((acc, e) => {
        acc[e.mealType] = (acc[e.mealType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const recentDays = new Set(
        entries
          .filter(e => e.consumedAt)
          .map(e => e.consumedAt!.toISOString().split('T')[0])
      ).size;

      return {
        total,
        totalCalories: Math.round(totalCalories),
        mealTypeCounts,
        activeDays: recentDays,
        averageCaloriesPerEntry: Math.round(totalCalories / total) || 0
      };
    } catch (error) {
      logger.error('Error getting food diary stats:', error);
      throw error;
    }
  }

  /**
   * Gera chave de cache para entradas
   */
  private generateEntriesCacheKey(filters: FoodDiaryFilters): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key as keyof FoodDiaryFilters]}`)
      .join('|');
    
    return `food-diary:entries:${sortedFilters}`;
  }

  /**
   * Constrói cláusula WHERE para busca
   */
  private buildWhereClause(filters: FoodDiaryFilters) {
    const where: any = {
      clientId: filters.clientId
    };

    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      where.consumedAt = {
        gte: startOfDay,
        lte: endOfDay
      };
    } else {
      if (filters.startDate) {
        where.consumedAt = { ...where.consumedAt, gte: filters.startDate };
      }
      if (filters.endDate) {
        where.consumedAt = { ...where.consumedAt, lte: filters.endDate };
      }
    }

    if (filters.mealType) {
      where.mealType = filters.mealType;
    }

    return where;
  }

  /**
   * Invalida cache do diário alimentar
   */
  private async invalidateDiaryCache(clientId: string, date?: Date) {
    try {
      // Invalidar cache específico do cliente
      await this.redis.invalidatePattern(`food-diary:entries:*clientId:${clientId}*`, { namespace: 'nutrition' });
      await this.redis.invalidatePattern(`food-diary:summary:${clientId}:*`, { namespace: 'nutrition' });
      await this.redis.invalidatePattern(`food-diary:stats:${clientId}:*`, { namespace: 'nutrition' });

      if (date) {
        const dateStr = date.toISOString().split('T')[0];
        await this.redis.del(`food-diary:summary:${clientId}:${dateStr}`, { namespace: 'nutrition' });
      }

      logger.info('🗑️ Food diary cache invalidated');
    } catch (error) {
      logger.error('Error invalidating food diary cache:', error);
      // Não falhar se cache invalidation falhar
    }
  }

  /**
   * Health check do service
   */
  async healthCheck() {
    try {
      // Testar PostgreSQL
      await this.prisma.foodDiaryEntry.count();
      
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
export const foodDiaryService = new FoodDiaryService();
