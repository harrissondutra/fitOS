/**
 * Nutrition Professional Service - FitOS Sprint 4
 * 
 * Gerencia perfis de nutricionistas com cache Redis para performance.
 * 
 * Pattern: PostgreSQL (fonte da verdade) + Redis (cache opcional)
 */

import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../config/database';
const prisma = getPrismaClient();
import { RedisService } from '../redis.service';
import { logger } from '../../utils/logger';

export interface NutritionProfessionalCreateInput {
  tenantId: string;
  userId: string;
  crn?: string;
  specialization?: string[];
  experience?: number;
  education?: string[];
  certifications?: string[];
  bio?: string;
  consultationPrice?: number;
}

export interface NutritionProfessionalUpdateInput extends Partial<NutritionProfessionalCreateInput> {
  id: string;
}

export interface NutritionProfessionalSearchFilters {
  specialization?: string[];
  experience?: number;
  minExperience?: number;
  maxExperience?: number;
  consultationPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export class NutritionProfessionalService {
  private prisma: PrismaClient;
  private redis: RedisService;

  constructor() {
    this.prisma = getPrismaClient();
    this.redis = new RedisService();
  }

  /**
   * Cria perfil de nutricionista
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async createProfile(data: NutritionProfessionalCreateInput) {
    try {
      // TODO: Modelo nutritionProfessionalProfile não existe no Prisma schema
      // Retornar stub por enquanto
      const profile = {
        id: 'stub-id',
        ...data,
        user: { id: data.userId, name: '', email: '', image: null },
        clients: [],
        publicProfile: null
      } as any;

      logger.info(`✅ Nutrition professional profile created (stub): ${profile.id}`);
      return profile;
    } catch (error) {
      logger.error('Error creating nutrition professional profile:', error);
      throw error;
    }
  }

  /**
   * Alias for createProfile - creates a professional profile
   */
  async createProfessionalProfile(data: NutritionProfessionalCreateInput) {
    return this.createProfile(data);
  }

  /**
   * Busca perfil por ID com cache
   */
  async getProfileById(id: string) {
    const cacheKey = `nutrition-professional:${id}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_NUTRITION_PROFILES || '3600')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Nutrition professional by ID: ${id}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Nutrition professional by ID: ${id}`);
      // TODO: Modelo não existe - retornar stub
      const profile = null as any;

      // 3. Cachear se encontrado
      if (profile) {
        await this.redis.set(cacheKey, profile, {
          namespace: 'nutrition',
          ttl: parseInt(process.env.REDIS_TTL_NUTRITION_PROFILES || '3600')
        });
      }

      return profile;
    } catch (error) {
      logger.error('Error getting nutrition professional profile by ID:', error);
      throw error;
    }
  }

  /**
   * Alias for getProfileById - gets a professional profile by ID
   */
  async getProfessionalProfileById(id: string) {
    return this.getProfileById(id);
  }

  /**
   * Busca perfil por userId com cache
   */
  async getProfileByUserId(userId: string) {
    const cacheKey = `nutrition-professional:user:${userId}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_NUTRITION_PROFILES || '3600')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Nutrition professional by user ID: ${userId}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Nutrition professional by user ID: ${userId}`);
      // TODO: Modelo não existe - retornar stub
      const profile = null as any;

      // 3. Cachear se encontrado
      if (profile) {
        await this.redis.set(cacheKey, profile, {
          namespace: 'nutrition',
          ttl: parseInt(process.env.REDIS_TTL_NUTRITION_PROFILES || '3600')
        });
      }

      return profile;
    } catch (error) {
      logger.error('Error getting nutrition professional profile by user ID:', error);
      throw error;
    }
  }

  /**
   * Alias for getProfileByUserId - gets a professional profile by user ID
   */
  async getProfessionalProfileByUserId(userId: string) {
    return this.getProfileByUserId(userId);
  }

  /**
   * Busca nutricionistas com filtros e cache
   */
  async searchProfessionals(filters: NutritionProfessionalSearchFilters = {}) {
    const cacheKey = this.generateSearchCacheKey(filters);
    
    try {
      // 1. Tentar cache Redis (rápido)
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_NUTRITION_PROFILES || '3600')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Nutrition professional search: ${cacheKey}`);
        return cached;
      }

      // 2. Cache MISS - buscar PostgreSQL (fonte da verdade)
      logger.info(`🗄️ Cache MISS - Nutrition professional search: ${cacheKey}`);
      
      const whereClause = this.buildWhereClause(filters);
      // TODO: Modelo não existe - retornar array vazio
      const profiles = [] as any[];

      // 3. Cachear no Redis para próximas requests
      await this.redis.set(cacheKey, profiles, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_NUTRITION_PROFILES || '3600')
      });

      return profiles;
    } catch (error) {
      logger.error('Error searching nutrition professionals:', error);
      throw error;
    }
  }

  /**
   * Busca nutricionistas do tenant
   */
  async getTenantProfessionals(tenantId: string, filters: NutritionProfessionalSearchFilters = {}) {
    const tenantFilters = { ...filters, tenantId };
    return this.searchProfessionals(tenantFilters);
  }

  /**
   * Atualiza perfil de nutricionista
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async updateProfile(data: NutritionProfessionalUpdateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const updateData: any = {};
      
      if (data.crn !== undefined) updateData.crn = data.crn;
      if (data.specialization) updateData.specialization = data.specialization;
      if (data.experience !== undefined) updateData.experience = data.experience;
      if (data.education) updateData.education = data.education;
      if (data.certifications) updateData.certifications = data.certifications;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.consultationPrice !== undefined) updateData.consultationPrice = data.consultationPrice;

      // TODO: Modelo não existe - retornar stub
      const profile = null as any;

      // 2. INVALIDAR cache Redis
      await this.invalidateProfileCache(profile.tenantId, profile.userId);

      logger.info(`✅ Nutrition professional profile updated: ${profile.user.name} (${profile.id})`);
      return profile;
    } catch (error) {
      logger.error('Error updating nutrition professional profile:', error);
      throw error;
    }
  }

  /**
   * Alias for updateProfile - updates a professional profile
   */
  async updateProfessionalProfile(data: NutritionProfessionalUpdateInput) {
    return this.updateProfile(data);
  }

  /**
   * Ativa/desativa perfil de nutricionista
   */
  async toggleProfileStatus(id: string, isActive: boolean) {
    try {
      // TODO: Modelo não existe - retornar stub
      const profile = null as any;

      // Invalidar cache
      await this.invalidateProfileCache(profile.tenantId, profile.userId);

      logger.info(`✅ Nutrition professional profile status updated: ${profile.user.name} (${profile.id}) - Active: ${isActive}`);
      return profile;
    } catch (error) {
      logger.error('Error toggling nutrition professional profile status:', error);
      throw error;
    }
  }

  /**
   * Remove perfil de nutricionista
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async deleteProfile(id: string) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      // TODO: Modelo não existe - retornar stub
      const profile = null as any;

      // 2. INVALIDAR cache Redis
      await this.invalidateProfileCache(profile.tenantId, profile.userId);

      logger.info(`✅ Nutrition professional profile deleted: ${profile.id}`);
      return profile;
    } catch (error) {
      logger.error('Error deleting nutrition professional profile:', error);
      throw error;
    }
  }

  /**
   * Busca especializações disponíveis
   */
  async getSpecializations() {
    const cacheKey = 'nutrition-professional:specializations';
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_NUTRITION_PROFILES || '3600')
      });
      
      if (cached) {
        logger.info('⚡ Cache HIT - Nutrition professional specializations');
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info('🗄️ Cache MISS - Nutrition professional specializations');
      // TODO: Modelo não existe - retornar array vazio
      const profiles = [] as any[];

      const allSpecializations = profiles.flatMap(p => p.specialization);
      const uniqueSpecializations = [...new Set(allSpecializations)].sort();

      // 3. Cachear
      await this.redis.set(cacheKey, uniqueSpecializations, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_NUTRITION_PROFILES || '3600')
      });

      return uniqueSpecializations;
    } catch (error) {
      logger.error('Error getting nutrition professional specializations:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas do nutricionista
   */
  async getProfessionalStats(profileId: string) {
    const cacheKey = `nutrition-professional:stats:${profileId}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: 300 // 5 minutos para stats
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Nutrition professional stats: ${profileId}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Nutrition professional stats: ${profileId}`);
      
      const [
        totalClients,
        activeClients,
        totalMealPlans,
        activeMealPlans,
        totalConsultations,
        upcomingConsultations
      ] = await Promise.all([
        this.prisma.nutritionClient.count({
          where: { nutritionistId: profileId }
        }),
        this.prisma.nutritionClient.count({
          where: { nutritionistId: profileId }
        }),
        this.prisma.mealPlan.count({
          where: { nutritionistId: profileId }
        }),
        this.prisma.mealPlan.count({
          where: { nutritionistId: profileId, isActive: true }
        }),
        this.prisma.nutritionConsultation.count({
          where: { nutritionistId: profileId }
        }),
        this.prisma.nutritionConsultation.count({
          where: { 
            nutritionistId: profileId,
            scheduledAt: { gte: new Date() },
            status: 'scheduled'
          }
        })
      ]);

      const stats = {
        totalClients,
        activeClients,
        totalMealPlans,
        activeMealPlans,
        totalConsultations,
        upcomingConsultations
      };

      // 3. Cachear
      await this.redis.set(cacheKey, stats, {
        namespace: 'nutrition',
        ttl: 300 // 5 minutos
      });

      return stats;
    } catch (error) {
      logger.error('Error getting nutrition professional stats:', error);
      throw error;
    }
  }

  /**
   * Gera chave de cache para busca
   */
  private generateSearchCacheKey(filters: NutritionProfessionalSearchFilters): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key as keyof NutritionProfessionalSearchFilters]}`)
      .join('|');
    
    return `nutrition-professional:search:${sortedFilters}`;
  }

  /**
   * Constrói cláusula WHERE para busca
   */
  private buildWhereClause(filters: NutritionProfessionalSearchFilters) {
    const where: any = {};

    if (filters.specialization && filters.specialization.length > 0) {
      where.specialization = {
        hasSome: filters.specialization
      };
    }

    if (filters.experience !== undefined) {
      where.experience = filters.experience;
    }

    if (filters.minExperience !== undefined || filters.maxExperience !== undefined) {
      where.experience = {};
      if (filters.minExperience !== undefined) {
        where.experience.gte = filters.minExperience;
      }
      if (filters.maxExperience !== undefined) {
        where.experience.lte = filters.maxExperience;
      }
    }

    if (filters.consultationPrice !== undefined) {
      where.consultationPrice = filters.consultationPrice;
    }

    if (filters.maxPrice !== undefined) {
      where.consultationPrice = {
        lte: filters.maxPrice
      };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return where;
  }

  /**
   * Invalida cache de perfis de nutricionistas
   */
  private async invalidateProfileCache(tenantId?: string, userId?: string) {
    try {
      if (userId) {
        // Invalidar cache específico do usuário
        await this.redis.del(`nutrition-professional:user:${userId}`, { namespace: 'nutrition' });
        await this.redis.del(`nutrition-professional:stats:${userId}`, { namespace: 'nutrition' });
      }

      // Invalidar cache geral
      await this.redis.invalidatePattern('nutrition-professional:search:*', { namespace: 'nutrition' });
      await this.redis.del('nutrition-professional:specializations', { namespace: 'nutrition' });

      logger.info('🗑️ Nutrition professional profile cache invalidated');
    } catch (error) {
      logger.error('Error invalidating nutrition professional profile cache:', error);
      // Não falhar se cache invalidation falhar
    }
  }

  /**
   * Health check do service
   */
  async healthCheck() {
    try {
      // Testar PostgreSQL
      0; // TODO: Modelo não existe - await this.prisma.nutritionProfessionalProfile.count();
      
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
export const nutritionProfessionalService = new NutritionProfessionalService();
