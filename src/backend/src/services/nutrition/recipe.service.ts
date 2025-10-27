/**
 * Recipe Service - FitOS Sprint 4
 * 
 * Gerencia receitas com cache Redis para performance.
 * 
 * Pattern: PostgreSQL (fonte da verdade) + Redis (cache opcional)
 */

import { PrismaClient } from '@prisma/client';
import { RedisService } from '../redis.service';
import { logger } from '../../utils/logger';
import { foodDatabaseService } from './food-database.service';

export interface RecipeCreateInput {
  tenantId: string;
  name: string;
  description?: string;
  instructions: string;
  prepTime?: number;
  cookTime?: number;
  servings: number;
  difficulty?: string;
  tags?: string[];
  imageUrl?: string;
  isPublic?: boolean;
  ingredients: RecipeIngredientInput[];
}

export interface RecipeIngredientInput {
  foodId?: string;
  name: string;
  quantity: number;
  unit: string;
  order: number;
}

export interface RecipeUpdateInput extends Partial<RecipeCreateInput> {
  id: string;
}

export interface RecipeSearchFilters {
  tenantId?: string;
  name?: string;
  tags?: string[];
  difficulty?: string;
  maxPrepTime?: number;
  maxCookTime?: number;
  servings?: number;
  isPublic?: boolean;
  limit?: number;
  offset?: number;
}

export class RecipeService {
  private prisma: PrismaClient;
  private redis: RedisService;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new RedisService();
  }

  /**
   * Cria nova receita
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async createRecipe(data: RecipeCreateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const recipe = await this.prisma.recipe.create({
        data: {
          tenantId: data.tenantId,
          createdById: data.tenantId, // TODO: criar campo createdById no modelo
          name: data.name,
          description: data.description,
          instructions: Array.isArray(data.instructions) ? data.instructions : [data.instructions] as any,
          prepTime: data.prepTime,
          cookTime: data.cookTime,
          servings: data.servings,
          difficulty: data.difficulty || 'easy',
          tags: data.tags || [] as any,
          imageUrl: data.imageUrl,
          isPublic: data.isPublic || false,
          ingredients: data.ingredients || [] as any
        } as any,
      });

      // 2. Calcular macros nutricionais
      const calculatedRecipe = await this.calculateRecipeMacros(recipe);

      // 3. Atualizar com macros calculados
      const updatedRecipe = await this.prisma.recipe.update({
        where: { id: calculatedRecipe.id },
        data: {
          calories: calculatedRecipe.calories,
          protein: calculatedRecipe.protein,
          carbs: calculatedRecipe.carbs,
          fat: calculatedRecipe.fat,
          fiber: calculatedRecipe.fiber
        },
      });

      // 4. INVALIDAR cache Redis
      await this.invalidateRecipeCache();

      logger.info(`✅ Recipe created: ${updatedRecipe.name} (${updatedRecipe.id})`);
      return updatedRecipe;
    } catch (error) {
      logger.error('Error creating recipe:', error);
      throw error;
    }
  }

  /**
   * Busca receita por ID com cache
   */
  async getRecipeById(id: string) {
    const cacheKey = `recipe:${id}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_RECIPES || '3600')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Recipe by ID: ${id}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Recipe by ID: ${id}`);
      const recipe = await this.prisma.recipe.findUnique({
        where: { id },
      });

      // 3. Cachear se encontrado
      if (recipe) {
        await this.redis.set(cacheKey, recipe, {
          namespace: 'nutrition',
          ttl: parseInt(process.env.REDIS_TTL_RECIPES || '3600')
        });
      }

      return recipe;
    } catch (error) {
      logger.error('Error getting recipe by ID:', error);
      throw error;
    }
  }

  /**
   * Busca receitas com filtros e cache
   */
  async searchRecipes(filters: RecipeSearchFilters = {}) {
    const cacheKey = this.generateSearchCacheKey(filters);
    
    try {
      // 1. Tentar cache Redis (rápido)
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_RECIPES || '3600')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Recipe search: ${cacheKey}`);
        return cached;
      }

      // 2. Cache MISS - buscar PostgreSQL (fonte da verdade)
      logger.info(`🗄️ Cache MISS - Recipe search: ${cacheKey}`);
      
      const whereClause = this.buildWhereClause(filters);
      const recipes = await this.prisma.recipe.findMany({
        where: whereClause,
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { createdAt: 'desc' }
      });

      // 3. Cachear no Redis para próximas requests
      await this.redis.set(cacheKey, recipes, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_RECIPES || '3600')
      });

      return recipes;
    } catch (error) {
      logger.error('Error searching recipes:', error);
      throw error;
    }
  }

  /**
   * Busca receitas públicas (marketplace)
   */
  async getPublicRecipes(filters: RecipeSearchFilters = {}) {
    const publicFilters = { ...filters, isPublic: true };
    return this.searchRecipes(publicFilters);
  }

  /**
   * Busca receitas do tenant
   */
  async getTenantRecipes(tenantId: string, filters: RecipeSearchFilters = {}) {
    const tenantFilters = { ...filters, tenantId };
    return this.searchRecipes(tenantFilters);
  }

  /**
   * Busca todas as receitas (similar to getTenantRecipes but without tenant ID filter)
   */
  async getAllRecipes(tenantId?: string) {
    const filters: RecipeSearchFilters = {};
    if (tenantId) {
      // Use searchRecipes with tenant filter
      return this.searchRecipes({ ...filters, tenantId });
    }
    return this.searchRecipes(filters);
  }

  /**
   * Atualiza receita
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async updateRecipe(data: RecipeUpdateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const updateData: any = {};
      
      if (data.name) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.instructions) updateData.instructions = data.instructions;
      if (data.prepTime !== undefined) updateData.prepTime = data.prepTime;
      if (data.cookTime !== undefined) updateData.cookTime = data.cookTime;
      if (data.servings) updateData.servings = data.servings;
      if (data.difficulty) updateData.difficulty = data.difficulty;
      if (data.tags) updateData.tags = data.tags;
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
      if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

      const recipe = await this.prisma.recipe.update({
        where: { id: data.id },
        data: updateData,
      });

      // 2. Recalcular macros se necessário
      const calculatedRecipe = await this.calculateRecipeMacros(recipe);
      
      const updatedRecipe = await this.prisma.recipe.update({
        where: { id: calculatedRecipe.id },
        data: {
          calories: calculatedRecipe.calories,
          protein: calculatedRecipe.protein,
          carbs: calculatedRecipe.carbs,
          fat: calculatedRecipe.fat,
          fiber: calculatedRecipe.fiber
        },
      });

      // 3. INVALIDAR cache Redis
      await this.invalidateRecipeCache();

      logger.info(`✅ Recipe updated: ${updatedRecipe.name} (${updatedRecipe.id})`);
      return updatedRecipe;
    } catch (error) {
      logger.error('Error updating recipe:', error);
      throw error;
    }
  }

  /**
   * Remove receita
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async deleteRecipe(id: string) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const recipe = await this.prisma.recipe.delete({
        where: { id }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateRecipeCache();

      logger.info(`✅ Recipe deleted: ${recipe.name} (${recipe.id})`);
      return recipe;
    } catch (error) {
      logger.error('Error deleting recipe:', error);
      throw error;
    }
  }

  /**
   * Busca tags de receitas
   */
  async getRecipeTags() {
    const cacheKey = 'recipe:tags';
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_RECIPES || '3600')
      });
      
      if (cached) {
        logger.info('⚡ Cache HIT - Recipe tags');
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info('🗄️ Cache MISS - Recipe tags');
      const recipes = await this.prisma.recipe.findMany({
        select: { tags: true },
        where: { tags: { not: { equals: [] } } }
      });

      const allTags = recipes.flatMap(r => r.tags);
      const uniqueTags = [...new Set(allTags)].sort();

      // 3. Cachear
      await this.redis.set(cacheKey, uniqueTags, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_RECIPES || '3600')
      });

      return uniqueTags;
    } catch (error) {
      logger.error('Error getting recipe tags:', error);
      throw error;
    }
  }

  /**
   * Calcula macros nutricionais da receita
   */
  async calculateRecipeMacros(recipe: any) {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    for (const ingredient of recipe.ingredients) {
      if (ingredient.food) {
        const macros = foodDatabaseService.calculateMacros(
          ingredient.food,
          ingredient.quantity,
          ingredient.unit
        );
        
        totalCalories += macros.calories;
        totalProtein += macros.protein;
        totalCarbs += macros.carbs;
        totalFat += macros.fat;
        totalFiber += macros.fiber;
      }
    }

    // Dividir pelos servings
    const servings = recipe.servings || 1;
    
    return {
      ...recipe,
      calories: Math.round(totalCalories / servings),
      protein: Math.round((totalProtein / servings) * 100) / 100,
      carbs: Math.round((totalCarbs / servings) * 100) / 100,
      fat: Math.round((totalFat / servings) * 100) / 100,
      fiber: Math.round((totalFiber / servings) * 100) / 100
    };
  }

  /**
   * Calcula macros para uma quantidade específica da receita
   */
  calculateRecipeMacrosForServing(recipe: any, servings: number) {
    const baseServings = recipe.servings || 1;
    const multiplier = servings / baseServings;

    return {
      calories: Math.round(recipe.calories * multiplier),
      protein: Math.round((recipe.protein * multiplier) * 100) / 100,
      carbs: Math.round((recipe.carbs * multiplier) * 100) / 100,
      fat: Math.round((recipe.fat * multiplier) * 100) / 100,
      fiber: Math.round((recipe.fiber * multiplier) * 100) / 100
    };
  }

  /**
   * Gera chave de cache para busca
   */
  private generateSearchCacheKey(filters: RecipeSearchFilters): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key as keyof RecipeSearchFilters]}`)
      .join('|');
    
    return `recipe:search:${sortedFilters}`;
  }

  /**
   * Constrói cláusula WHERE para busca
   */
  private buildWhereClause(filters: RecipeSearchFilters) {
    const where: any = {};

    if (filters.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive'
      };
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags
      };
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters.maxPrepTime !== undefined) {
      where.prepTime = {
        lte: filters.maxPrepTime
      };
    }

    if (filters.maxCookTime !== undefined) {
      where.cookTime = {
        lte: filters.maxCookTime
      };
    }

    if (filters.servings) {
      where.servings = filters.servings;
    }

    if (filters.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    return where;
  }

  /**
   * Invalida cache de receitas
   */
  private async invalidateRecipeCache() {
    try {
      // Invalidar todas as buscas e listas
      await this.redis.invalidatePattern('recipe:search:*', { namespace: 'nutrition' });
      await this.redis.invalidatePattern('recipe:*', { namespace: 'nutrition' });
      await this.redis.del('recipe:tags', { namespace: 'nutrition' });

      logger.info('🗑️ Recipe cache invalidated');
    } catch (error) {
      logger.error('Error invalidating recipe cache:', error);
      // Não falhar se cache invalidation falhar
    }
  }

  /**
   * Health check do service
   */
  async healthCheck() {
    try {
      // Testar PostgreSQL
      await this.prisma.recipe.count();
      
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
export const recipeService = new RecipeService();
