/**
 * Food Database Service - FitOS Sprint 4
 * 
 * Gerencia a base de dados de alimentos (Tabela TACO + customizados)
 * com cache Redis para performance máxima.
 * 
 * Pattern: PostgreSQL (fonte da verdade) + Redis (cache opcional)
 */

import { PrismaClient } from '@prisma/client';
import { RedisService } from '../redis.service';
import { logger } from '../../utils/logger';

export interface FoodSearchFilters {
  name?: string;
  category?: string;
  brand?: string;
  source?: string;
  minCalories?: number;
  maxCalories?: number;
  minProtein?: number;
  maxProtein?: number;
  limit?: number;
  offset?: number;
}

export interface FoodCreateInput {
  name: string;
  brand?: string;
  category?: string;
  source?: string;
  barcode?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodium?: number;
  servingSize?: number;
  servingUnit?: string;
  isVerified?: boolean;
}

export interface FoodUpdateInput extends Partial<FoodCreateInput> {
  id: string;
}

export class FoodDatabaseService {
  private prisma: PrismaClient;
  private redis: RedisService;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new RedisService();
  }

  /**
   * Busca alimentos com cache Redis
   * Pattern: Cache HIT -> Redis | Cache MISS -> PostgreSQL -> Cache
   */
  async searchFoods(filters: FoodSearchFilters = {}) {
    const cacheKey = this.generateSearchCacheKey(filters);
    
    try {
      // 1. Tentar cache Redis (rápido)
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_FOOD_DATABASE || '3600')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Food search: ${cacheKey}`);
        return cached;
      }

      // 2. Cache MISS - buscar PostgreSQL (fonte da verdade)
      logger.info(`🗄️ Cache MISS - Food search: ${cacheKey}`);
      
      const whereClause = this.buildWhereClause(filters);
      const foods = await this.prisma.food.findMany({
        where: whereClause,
        take: filters.limit || 50,
        skip: filters.offset || 0,
        orderBy: { name: 'asc' }
      });

      // 3. Cachear no Redis para próximas requests
      await this.redis.set(cacheKey, foods, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_FOOD_DATABASE || '3600')
      });

      return foods;
    } catch (error) {
      logger.error('Error searching foods:', error);
      throw error;
    }
  }

  /**
   * Busca alimento por ID com cache
   */
  async getFoodById(id: string) {
    const cacheKey = `food:${id}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_FOOD_DATABASE || '3600')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Food by ID: ${id}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Food by ID: ${id}`);
      const food = await this.prisma.food.findUnique({
        where: { id }
      });

      // 3. Cachear se encontrado
      if (food) {
        await this.redis.set(cacheKey, food, {
          namespace: 'nutrition',
          ttl: parseInt(process.env.REDIS_TTL_FOOD_DATABASE || '3600')
        });
      }

      return food;
    } catch (error) {
      logger.error('Error getting food by ID:', error);
      throw error;
    }
  }

  /**
   * Busca alimento por código de barras
   */
  async getFoodByBarcode(barcode: string) {
    const cacheKey = `food:barcode:${barcode}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_FOOD_DATABASE || '3600')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Food by barcode: ${barcode}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Food by barcode: ${barcode}`);
      const food = await this.prisma.food.findUnique({
        where: { barcode }
      });

      // 3. Cachear se encontrado
      if (food) {
        await this.redis.set(cacheKey, food, {
          namespace: 'nutrition',
          ttl: parseInt(process.env.REDIS_TTL_FOOD_DATABASE || '3600')
        });
      }

      return food;
    } catch (error) {
      logger.error('Error getting food by barcode:', error);
      throw error;
    }
  }

  /**
   * Cria novo alimento
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async createFood(data: FoodCreateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const food = await this.prisma.food.create({
        data: {
          ...data,
          servingSize: data.servingSize || 100,
          servingUnit: data.servingUnit || 'g',
          source: data.source || 'Custom',
          isVerified: data.isVerified || false
        }
      });

      // 2. INVALIDAR cache Redis (agora está desatualizado)
      await this.invalidateFoodCache();

      logger.info(`✅ Food created: ${food.name} (${food.id})`);
      return food;
    } catch (error) {
      logger.error('Error creating food:', error);
      throw error;
    }
  }

  /**
   * Atualiza alimento existente
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async updateFood(data: FoodUpdateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const food = await this.prisma.food.update({
        where: { id: data.id },
        data: {
          name: data.name,
          brand: data.brand,
          category: data.category,
          source: data.source,
          barcode: data.barcode,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          fiber: data.fiber,
          sugar: data.sugar,
          sodium: data.sodium,
          servingSize: data.servingSize,
          servingUnit: data.servingUnit,
          isVerified: data.isVerified
        }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateFoodCache(food.id);

      logger.info(`✅ Food updated: ${food.name} (${food.id})`);
      return food;
    } catch (error) {
      logger.error('Error updating food:', error);
      throw error;
    }
  }

  /**
   * Remove alimento
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async deleteFood(id: string) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const food = await this.prisma.food.delete({
        where: { id }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateFoodCache(id);

      logger.info(`✅ Food deleted: ${food.name} (${food.id})`);
      return food;
    } catch (error) {
      logger.error('Error deleting food:', error);
      throw error;
    }
  }

  /**
   * Busca categorias de alimentos
   */
  async getFoodCategories() {
    const cacheKey = 'food:categories';
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_FOOD_DATABASE || '3600')
      });
      
      if (cached) {
        logger.info('⚡ Cache HIT - Food categories');
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info('🗄️ Cache MISS - Food categories');
      const categories = await this.prisma.food.findMany({
        select: { category: true },
        distinct: ['category'],
        where: { category: { not: null } },
        orderBy: { category: 'asc' }
      });

      const categoryList = categories.map(c => c.category).filter(Boolean);

      // 3. Cachear
      await this.redis.set(cacheKey, categoryList, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_FOOD_DATABASE || '3600')
      });

      return categoryList;
    } catch (error) {
      logger.error('Error getting food categories:', error);
      throw error;
    }
  }

  /**
   * Busca marcas de alimentos
   */
  async getFoodBrands() {
    const cacheKey = 'food:brands';
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_FOOD_DATABASE || '3600')
      });
      
      if (cached) {
        logger.info('⚡ Cache HIT - Food brands');
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info('🗄️ Cache MISS - Food brands');
      const brands = await this.prisma.food.findMany({
        select: { brand: true },
        distinct: ['brand'],
        where: { brand: { not: null } },
        orderBy: { brand: 'asc' }
      });

      const brandList = brands.map(b => b.brand).filter(Boolean);

      // 3. Cachear
      await this.redis.set(cacheKey, brandList, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_FOOD_DATABASE || '3600')
      });

      return brandList;
    } catch (error) {
      logger.error('Error getting food brands:', error);
      throw error;
    }
  }

  /**
   * Calcula macros nutricionais para uma quantidade específica
   */
  calculateMacros(food: any, quantity: number, unit: string = 'g') {
    const servingSize = food.servingSize || 100;
    const servingUnit = food.servingUnit || 'g';
    
    // Converter para gramas se necessário
    let quantityInGrams = quantity;
    if (unit !== 'g' && unit !== servingUnit) {
      // Aqui você pode implementar conversões específicas
      // Por simplicidade, assumimos que a quantidade já está em gramas
      quantityInGrams = quantity;
    }

    const multiplier = quantityInGrams / servingSize;

    return {
      calories: Math.round(food.calories * multiplier),
      protein: Math.round((food.protein * multiplier) * 100) / 100,
      carbs: Math.round((food.carbs * multiplier) * 100) / 100,
      fat: Math.round((food.fat * multiplier) * 100) / 100,
      fiber: Math.round((food.fiber * multiplier) * 100) / 100,
      sugar: food.sugar ? Math.round((food.sugar * multiplier) * 100) / 100 : 0,
      sodium: food.sodium ? Math.round((food.sodium * multiplier) * 100) / 100 : 0
    };
  }

  /**
   * Gera chave de cache para busca
   */
  private generateSearchCacheKey(filters: FoodSearchFilters): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key as keyof FoodSearchFilters]}`)
      .join('|');
    
    return `food:search:${sortedFilters}`;
  }

  /**
   * Constrói cláusula WHERE para busca
   */
  private buildWhereClause(filters: FoodSearchFilters) {
    const where: any = {};

    if (filters.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive'
      };
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.brand) {
      where.brand = {
        contains: filters.brand,
        mode: 'insensitive'
      };
    }

    if (filters.source) {
      where.source = filters.source;
    }

    if (filters.minCalories !== undefined || filters.maxCalories !== undefined) {
      where.calories = {};
      if (filters.minCalories !== undefined) {
        where.calories.gte = filters.minCalories;
      }
      if (filters.maxCalories !== undefined) {
        where.calories.lte = filters.maxCalories;
      }
    }

    if (filters.minProtein !== undefined || filters.maxProtein !== undefined) {
      where.protein = {};
      if (filters.minProtein !== undefined) {
        where.protein.gte = filters.minProtein;
      }
      if (filters.maxProtein !== undefined) {
        where.protein.lte = filters.maxProtein;
      }
    }

    return where;
  }

  /**
   * Invalida cache de alimentos
   */
  private async invalidateFoodCache(foodId?: string) {
    try {
      // Invalidar cache específico do alimento
      if (foodId) {
        await this.redis.del(`food:${foodId}`, { namespace: 'nutrition' });
      }

      // Invalidar todas as buscas e listas
      await this.redis.invalidatePattern('food:search:*', { namespace: 'nutrition' });
      await this.redis.del('food:categories', { namespace: 'nutrition' });
      await this.redis.del('food:brands', { namespace: 'nutrition' });

      logger.info('🗑️ Food cache invalidated');
    } catch (error) {
      logger.error('Error invalidating food cache:', error);
      // Não falhar se cache invalidation falhar
    }
  }

  /**
   * Health check do service
   */
  async healthCheck() {
    try {
      // Testar PostgreSQL
      await this.prisma.food.count();
      
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
export const foodDatabaseService = new FoodDatabaseService();
