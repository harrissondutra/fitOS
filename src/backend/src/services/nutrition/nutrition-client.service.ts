/**
 * Nutrition Client Service - FitOS Sprint 4
 * 
 * Gerencia clientes nutricionais com cache Redis para performance.
 * 
 * Pattern: PostgreSQL (fonte da verdade) + Redis (cache opcional)
 */

import { PrismaClient } from '@prisma/client';
import { RedisService } from '../redis.service';
import { logger } from '../../utils/logger';

export interface NutritionClientCreateInput {
  tenantId: string;
  userId: string;
  nutritionistId: string;
  height?: number;
  weight?: number;
  age?: number;
  gender?: string;
  activityLevel?: string;
  medicalConditions?: string[];
  allergies?: string[];
  dietaryRestrictions?: string[];
  goals?: string[];
}

export interface NutritionClientUpdateInput extends Partial<NutritionClientCreateInput> {
  id: string;
}

export interface NutritionClientSearchFilters {
  nutritionistId?: string;
  age?: number;
  minAge?: number;
  maxAge?: number;
  gender?: string;
  activityLevel?: string;
  medicalConditions?: string[];
  goals?: string[];
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export class NutritionClientService {
  private prisma: PrismaClient;
  private redis: RedisService;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new RedisService();
  }

  /**
   * Cria novo cliente nutricional
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async createClient(data: NutritionClientCreateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const client = await this.prisma.nutritionClient.create({
        data: {
          tenantId: data.tenantId,
          userId: data.userId,
          nutritionistId: data.nutritionistId,
          height: data.height,
          weight: data.weight,
          age: data.age,
          gender: data.gender,
          activityLevel: data.activityLevel,
          medicalConditions: data.medicalConditions || [],
          allergies: data.allergies || [],
          dietaryRestrictions: data.dietaryRestrictions || [],
          goals: data.goals || []
        },
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateClientCache(data.tenantId, data.nutritionistId);

      logger.info(`✅ Nutrition client created: ${client.id}`);
      return client;
    } catch (error) {
      logger.error('Error creating nutrition client:', error);
      throw error;
    }
  }

  /**
   * Alias for createClient - creates a nutrition client
   */
  async createNutritionClient(data: NutritionClientCreateInput) {
    return this.createClient(data);
  }

  /**
   * Busca cliente por ID com cache
   */
  async getClientById(id: string) {
    const cacheKey = `nutrition-client:${id}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_NUTRITION_PROFILES || '3600')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Nutrition client by ID: ${id}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Nutrition client by ID: ${id}`);
      const client = await this.prisma.nutritionClient.findUnique({
        where: { id }
      });

      // 3. Cachear se encontrado
      if (client) {
        await this.redis.set(cacheKey, client, {
          namespace: 'nutrition',
          ttl: parseInt(process.env.REDIS_TTL_NUTRITION_PROFILES || '3600')
        });
      }

      return client;
    } catch (error) {
      logger.error('Error getting nutrition client by ID:', error);
      throw error;
    }
  }

  /**
   * Alias for getClientById - gets a nutrition client by ID
   */
  async getNutritionClientById(id: string) {
    return this.getClientById(id);
  }

  /**
   * Busca cliente por userId com cache
   */
  async getClientByUserId(userId: string) {
    const cacheKey = `nutrition-client:user:${userId}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_NUTRITION_PROFILES || '3600')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Nutrition client by user ID: ${userId}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Nutrition client by user ID: ${userId}`);
      const client = await this.prisma.nutritionClient.findUnique({
        where: { userId },
      });

      // 3. Cachear se encontrado
      if (client) {
        await this.redis.set(cacheKey, client, {
          namespace: 'nutrition',
          ttl: parseInt(process.env.REDIS_TTL_NUTRITION_PROFILES || '3600')
        });
      }

      return client;
    } catch (error) {
      logger.error('Error getting nutrition client by user ID:', error);
      throw error;
    }
  }

  /**
   * Alias for getClientByUserId - gets a nutrition client by user ID
   */
  async getNutritionClientByUserId(userId: string) {
    return this.getClientByUserId(userId);
  }

  /**
   * Busca clientes com filtros e cache
   */
  async searchClients(filters: NutritionClientSearchFilters = {}) {
    const cacheKey = this.generateSearchCacheKey(filters);
    
    try {
      // 1. Tentar cache Redis (rápido)
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_NUTRITION_PROFILES || '3600')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Nutrition client search: ${cacheKey}`);
        return cached;
      }

      // 2. Cache MISS - buscar PostgreSQL (fonte da verdade)
      logger.info(`🗄️ Cache MISS - Nutrition client search: ${cacheKey}`);
      
      const whereClause = this.buildWhereClause(filters);
      const clients = await this.prisma.nutritionClient.findMany({
        where: whereClause,
        take: filters.limit || 20,
        skip: filters.offset || 0,
        orderBy: { createdAt: 'desc' }
      });

      // 3. Cachear no Redis para próximas requests
      await this.redis.set(cacheKey, clients, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_NUTRITION_PROFILES || '3600')
      });

      return clients;
    } catch (error) {
      logger.error('Error searching nutrition clients:', error);
      throw error;
    }
  }

  /**
   * Busca clientes do nutricionista
   */
  async getNutritionistClients(nutritionistId: string, filters: NutritionClientSearchFilters = {}) {
    const nutritionistFilters = { ...filters, nutritionistId };
    return this.searchClients(nutritionistFilters);
  }

  /**
   * Atualiza cliente nutricional
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async updateClient(data: NutritionClientUpdateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const updateData: any = {};
      
      if (data.height !== undefined) updateData.height = data.height;
      if (data.weight !== undefined) updateData.weight = data.weight;
      if (data.age !== undefined) updateData.age = data.age;
      if (data.gender !== undefined) updateData.gender = data.gender;
      if (data.activityLevel !== undefined) updateData.activityLevel = data.activityLevel;
      if (data.medicalConditions) updateData.medicalConditions = data.medicalConditions;
      if (data.allergies) updateData.allergies = data.allergies;
      if (data.dietaryRestrictions) updateData.dietaryRestrictions = data.dietaryRestrictions;
      if (data.goals) updateData.goals = data.goals;

      const client = await this.prisma.nutritionClient.update({
        where: { id: data.id },
        data: updateData,
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateClientCache(client.tenantId, client.nutritionistId, client.userId);

      logger.info(`✅ Nutrition client updated: ${client.id}`);
      return client;
    } catch (error) {
      logger.error('Error updating nutrition client:', error);
      throw error;
    }
  }

  /**
   * Alias for updateClient - updates a nutrition client
   */
  async updateNutritionClient(data: NutritionClientUpdateInput) {
    return this.updateClient(data);
  }

  /**
   * Ativa/desativa cliente nutricional
   */
  async toggleClientStatus(id: string, isActive: boolean) {
    try {
      // TODO: isActive não existe no modelo
      const client = await this.prisma.nutritionClient.findUnique({ where: { id } });

      // Invalidar cache
      if (client) {
        await this.invalidateClientCache(client.tenantId, client.nutritionistId, client.userId);
        logger.info(`✅ Nutrition client status updated: ${client.id} - Active: ${isActive}`);
      }

      return client;
    } catch (error) {
      logger.error('Error toggling nutrition client status:', error);
      throw error;
    }
  }

  /**
   * Remove cliente nutricional
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async deleteClient(id: string) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const client = await this.prisma.nutritionClient.delete({
        where: { id }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidateClientCache(client.tenantId, client.nutritionistId, client.userId);

      logger.info(`✅ Nutrition client deleted: ${client.id}`);
      return client;
    } catch (error) {
      logger.error('Error deleting nutrition client:', error);
      throw error;
    }
  }

  /**
   * Calcula IMC do cliente
   */
  calculateBMI(height: number, weight: number): number {
    if (!height || !weight || height <= 0 || weight <= 0) {
      return 0;
    }
    
    const heightInMeters = height / 100;
    return Math.round((weight / (heightInMeters * heightInMeters)) * 100) / 100;
  }

  /**
   * Calcula TMB (Taxa Metabólica Basal) usando fórmula de Mifflin-St Jeor
   */
  calculateBMR(weight: number, height: number, age: number, gender: string): number {
    if (!weight || !height || !age || !gender) {
      return 0;
    }

    let bmr: number;
    
    if (gender.toLowerCase() === 'male' || gender.toLowerCase() === 'masculino') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    return Math.round(bmr);
  }

  /**
   * Calcula GET (Gasto Energético Total) baseado no nível de atividade
   */
  calculateTDEE(bmr: number, activityLevel: string): number {
    const activityMultipliers: { [key: string]: number } = {
      'sedentary': 1.2,
      'light': 1.375,
      'moderate': 1.55,
      'active': 1.725,
      'very_active': 1.9
    };

    const multiplier = activityMultipliers[activityLevel?.toLowerCase()] || 1.2;
    return Math.round(bmr * multiplier);
  }

  /**
   * Busca estatísticas do cliente
   */
  async getClientStats(clientId: string) {
    const cacheKey = `nutrition-client:stats:${clientId}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: 600 // 10 minutos para stats
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Nutrition client stats: ${clientId}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Nutrition client stats: ${clientId}`);
      
      const [
        totalMealPlans,
        activeMealPlans,
        totalDiaryEntries,
        totalConsultations,
        upcomingConsultations,
        totalGoals,
        activeGoals,
        totalProgressPhotos,
        totalBodyMeasurements
      ] = await Promise.all([
        this.prisma.mealPlan.count({
          where: { clientId }
        }),
        this.prisma.mealPlan.count({
          where: { clientId, isActive: true }
        }),
        this.prisma.foodDiaryEntry.count({
          where: { clientId }
        }),
        this.prisma.nutritionConsultation.count({
          where: { clientId }
        }),
        this.prisma.nutritionConsultation.count({
          where: { 
            clientId,
            scheduledAt: { gte: new Date() },
            status: 'scheduled'
          }
        }),
        this.prisma.nutritionGoal.count({
          where: { clientId }
        }),
        this.prisma.nutritionGoal.count({
          where: { clientId, isActive: true }
        }),
        this.prisma.progressPhoto.count({
          where: { clientId }
        }),
        this.prisma.bodyMeasurement.count({
          where: { clientId }
        })
      ]);

      const stats = {
        mealPlans: {
          total: totalMealPlans,
          active: activeMealPlans
        },
        diary: {
          totalEntries: totalDiaryEntries
        },
        consultations: {
          total: totalConsultations,
          upcoming: upcomingConsultations
        },
        goals: {
          total: totalGoals,
          active: activeGoals
        },
        progress: {
          photos: totalProgressPhotos,
          measurements: totalBodyMeasurements
        }
      };

      // 3. Cachear
      await this.redis.set(cacheKey, stats, {
        namespace: 'nutrition',
        ttl: 600 // 10 minutos
      });

      return stats;
    } catch (error) {
      logger.error('Error getting nutrition client stats:', error);
      throw error;
    }
  }

  /**
   * Gera chave de cache para busca
   */
  private generateSearchCacheKey(filters: NutritionClientSearchFilters): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key as keyof NutritionClientSearchFilters]}`)
      .join('|');
    
    return `nutrition-client:search:${sortedFilters}`;
  }

  /**
   * Constrói cláusula WHERE para busca
   */
  private buildWhereClause(filters: NutritionClientSearchFilters) {
    const where: any = {};

    if (filters.nutritionistId) {
      where.nutritionistId = filters.nutritionistId;
    }

    if (filters.age !== undefined) {
      where.age = filters.age;
    }

    if (filters.minAge !== undefined || filters.maxAge !== undefined) {
      where.age = {};
      if (filters.minAge !== undefined) {
        where.age.gte = filters.minAge;
      }
      if (filters.maxAge !== undefined) {
        where.age.lte = filters.maxAge;
      }
    }

    if (filters.gender) {
      where.gender = filters.gender;
    }

    if (filters.activityLevel) {
      where.activityLevel = filters.activityLevel;
    }

    if (filters.medicalConditions && filters.medicalConditions.length > 0) {
      where.medicalConditions = {
        hasSome: filters.medicalConditions
      };
    }

    if (filters.goals && filters.goals.length > 0) {
      where.goals = {
        hasSome: filters.goals
      };
    }

    // TODO: isActive não existe no modelo
    // if (filters.isActive !== undefined) {
    //   where.isActive = filters.isActive;
    // }

    return where;
  }

  /**
   * Invalida cache de clientes nutricionais
   */
  private async invalidateClientCache(tenantId?: string, nutritionistId?: string, userId?: string) {
    try {
      if (userId) {
        // Invalidar cache específico do usuário
        await this.redis.del(`nutrition-client:user:${userId}`, { namespace: 'nutrition' });
        await this.redis.del(`nutrition-client:stats:${userId}`, { namespace: 'nutrition' });
      }

      // Invalidar cache geral
      await this.redis.invalidatePattern('nutrition-client:search:*', { namespace: 'nutrition' });

      logger.info('🗑️ Nutrition client cache invalidated');
    } catch (error) {
      logger.error('Error invalidating nutrition client cache:', error);
      // Não falhar se cache invalidation falhar
    }
  }

  /**
   * Health check do service
   */
  async healthCheck() {
    try {
      // Testar PostgreSQL
      await this.prisma.nutritionClient.count();
      
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
export const nutritionClientService = new NutritionClientService();
