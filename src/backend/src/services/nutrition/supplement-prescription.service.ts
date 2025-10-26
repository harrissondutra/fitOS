/**
 * Supplement Prescription Service - FitOS Sprint 4
 * 
 * Gerencia prescrições de suplementos dos clientes com cache Redis para performance.
 * 
 * Pattern: PostgreSQL (fonte da verdade) + Redis (cache opcional)
 */

import { PrismaClient } from '@prisma/client';
import { RedisService } from '../redis.service';
import { logger } from '../../utils/logger';

export interface SupplementPrescriptionCreateInput {
  tenantId: string;
  clientId: string;
  nutritionistId: string;
  supplementName: string;
  brand?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  notes?: string;
}

export interface SupplementPrescriptionUpdateInput extends Partial<SupplementPrescriptionCreateInput> {
  id: string;
}

export interface SupplementPrescriptionFilters {
  clientId?: string;
  nutritionistId?: string;
  isActive?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface SupplementStats {
  prescriptions: {
    total: number;
    active: number;
    completed: number;
    expired: number;
  };
  supplements: {
    total: number;
    mostPrescribed: Array<{
      name: string;
      count: number;
    }>;
  };
  compliance: {
    averageDuration: number;
    completionRate: number;
  };
}

export class SupplementPrescriptionService {
  private prisma: PrismaClient;
  private redis: RedisService;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new RedisService();
  }

  /**
   * Cria nova prescrição de suplemento
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async createPrescription(data: SupplementPrescriptionCreateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const prescription = await this.prisma.supplementPrescription.create({
        data: {
          tenantId: data.tenantId,
          clientId: data.clientId,
          nutritionistId: data.nutritionistId,
          supplementName: data.supplementName,
          brand: data.brand,
          dosage: data.dosage,
          frequency: data.frequency,
          duration: data.duration,
          instructions: data.instructions,
          startDate: data.startDate,
          endDate: data.endDate,
          isActive: data.isActive,
          notes: data.notes
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
          nutritionist: {
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
      await this.invalidatePrescriptionCache(data.clientId, data.nutritionistId);

      logger.info(`✅ Supplement prescription created: ${prescription.supplementName} for ${prescription.client.user.name} (${prescription.id})`);
      return prescription;
    } catch (error) {
      logger.error('Error creating supplement prescription:', error);
      throw error;
    }
  }

  /**
   * Busca prescrição por ID com cache
   */
  async getPrescriptionById(id: string) {
    const cacheKey = `supplement-prescription:${id}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_SUPPLEMENTS || '1800')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Supplement prescription by ID: ${id}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Supplement prescription by ID: ${id}`);
      const prescription = await this.prisma.supplementPrescription.findUnique({
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
          nutritionist: {
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
      if (prescription) {
        await this.redis.set(cacheKey, prescription, {
          namespace: 'nutrition',
          ttl: parseInt(process.env.REDIS_TTL_SUPPLEMENTS || '1800')
        });
      }

      return prescription;
    } catch (error) {
      logger.error('Error getting supplement prescription by ID:', error);
      throw error;
    }
  }

  /**
   * Busca prescrições com filtros e cache
   */
  async getPrescriptions(filters: SupplementPrescriptionFilters) {
    const cacheKey = this.generateSearchCacheKey(filters);
    
    try {
      // 1. Tentar cache Redis (rápido)
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_SUPPLEMENTS || '1800')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Supplement prescriptions: ${cacheKey}`);
        return cached;
      }

      // 2. Cache MISS - buscar PostgreSQL (fonte da verdade)
      logger.info(`🗄️ Cache MISS - Supplement prescriptions: ${cacheKey}`);
      
      const whereClause = this.buildWhereClause(filters);
      const prescriptions = await this.prisma.supplementPrescription.findMany({
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
          nutritionist: {
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
      await this.redis.set(cacheKey, prescriptions, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_SUPPLEMENTS || '1800')
      });

      return prescriptions;
    } catch (error) {
      logger.error('Error getting supplement prescriptions:', error);
      throw error;
    }
  }

  /**
   * Busca prescrições ativas do cliente
   */
  async getActivePrescriptionsByClient(clientId: string) {
    const cacheKey = `supplement-prescription:active:${clientId}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_SUPPLEMENTS || '1800')
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Active supplement prescriptions: ${clientId}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Active supplement prescriptions: ${clientId}`);
      const prescriptions = await this.prisma.supplementPrescription.findMany({
        where: {
          clientId,
          isActive: true,
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } }
          ]
        },
        include: {
          nutritionist: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { startDate: 'desc' }
      });

      // 3. Cachear
      await this.redis.set(cacheKey, prescriptions, {
        namespace: 'nutrition',
        ttl: parseInt(process.env.REDIS_TTL_SUPPLEMENTS || '1800')
      });

      return prescriptions;
    } catch (error) {
      logger.error('Error getting active supplement prescriptions:', error);
      throw error;
    }
  }

  /**
   * Atualiza prescrição de suplemento
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async updatePrescription(data: SupplementPrescriptionUpdateInput) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const updateData: any = {};
      
      if (data.supplementName) updateData.supplementName = data.supplementName;
      if (data.brand !== undefined) updateData.brand = data.brand;
      if (data.dosage) updateData.dosage = data.dosage;
      if (data.frequency) updateData.frequency = data.frequency;
      if (data.duration) updateData.duration = data.duration;
      if (data.instructions !== undefined) updateData.instructions = data.instructions;
      if (data.startDate) updateData.startDate = data.startDate;
      if (data.endDate !== undefined) updateData.endDate = data.endDate;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.notes !== undefined) updateData.notes = data.notes;

      const prescription = await this.prisma.supplementPrescription.update({
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
          nutritionist: {
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
      await this.invalidatePrescriptionCache(prescription.clientId, prescription.nutritionistId);

      logger.info(`✅ Supplement prescription updated: ${prescription.supplementName} (${prescription.id})`);
      return prescription;
    } catch (error) {
      logger.error('Error updating supplement prescription:', error);
      throw error;
    }
  }

  /**
   * Remove prescrição de suplemento
   * Pattern: SEMPRE escrever no PostgreSQL + Invalidar cache
   */
  async deletePrescription(id: string) {
    try {
      // 1. SEMPRE escrever no PostgreSQL (fonte da verdade)
      const prescription = await this.prisma.supplementPrescription.delete({
        where: { id }
      });

      // 2. INVALIDAR cache Redis
      await this.invalidatePrescriptionCache(prescription.clientId, prescription.nutritionistId);

      logger.info(`✅ Supplement prescription deleted: ${prescription.supplementName} (${prescription.id})`);
      return prescription;
    } catch (error) {
      logger.error('Error deleting supplement prescription:', error);
      throw error;
    }
  }

  /**
   * Finaliza prescrição (marca como inativa)
   */
  async completePrescription(id: string, notes?: string) {
    try {
      const prescription = await this.prisma.supplementPrescription.update({
        where: { id },
        data: {
          isActive: false,
          endDate: new Date(),
          notes: notes ? `${prescription.notes || ''}\n\nFinalizada: ${notes}`.trim() : prescription.notes
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
          nutritionist: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      // Invalidar cache
      await this.invalidatePrescriptionCache(prescription.clientId, prescription.nutritionistId);

      logger.info(`✅ Supplement prescription completed: ${prescription.supplementName} (${prescription.id})`);
      return prescription;
    } catch (error) {
      logger.error('Error completing supplement prescription:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas de prescrições
   */
  async getPrescriptionStats(clientId?: string, nutritionistId?: string) {
    const cacheKey = `supplement-prescription:stats:${clientId || 'all'}:${nutritionistId || 'all'}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: 600 // 10 minutos para stats
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Supplement prescription stats: ${cacheKey}`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Supplement prescription stats: ${cacheKey}`);
      
      const whereClause: any = {};
      if (clientId) whereClause.clientId = clientId;
      if (nutritionistId) whereClause.nutritionistId = nutritionistId;

      const [
        totalPrescriptions,
        activePrescriptions,
        completedPrescriptions,
        expiredPrescriptions,
        supplementsCount,
        mostPrescribed,
        averageDuration
      ] = await Promise.all([
        this.prisma.supplementPrescription.count({ where: whereClause }),
        this.prisma.supplementPrescription.count({
          where: { ...whereClause, isActive: true }
        }),
        this.prisma.supplementPrescription.count({
          where: { ...whereClause, isActive: false }
        }),
        this.prisma.supplementPrescription.count({
          where: {
            ...whereClause,
            endDate: { lt: new Date() },
            isActive: true
          }
        }),
        this.prisma.supplementPrescription.groupBy({
          by: ['supplementName'],
          where: whereClause,
          _count: { supplementName: true }
        }),
        this.prisma.supplementPrescription.groupBy({
          by: ['supplementName'],
          where: whereClause,
          _count: { supplementName: true },
          orderBy: { _count: { supplementName: 'desc' } },
          take: 5
        }),
        this.prisma.supplementPrescription.aggregate({
          where: whereClause,
          _avg: {
            // Assumindo que duration é em dias
            // Seria necessário converter duration string para número
          }
        })
      ]);

      const stats: SupplementStats = {
        prescriptions: {
          total: totalPrescriptions,
          active: activePrescriptions,
          completed: completedPrescriptions,
          expired: expiredPrescriptions
        },
        supplements: {
          total: supplementsCount.length,
          mostPrescribed: mostPrescribed.map(item => ({
            name: item.supplementName,
            count: item._count.supplementName
          }))
        },
        compliance: {
          averageDuration: 0, // Seria calculado baseado na duration
          completionRate: totalPrescriptions > 0 ? Math.round((completedPrescriptions / totalPrescriptions) * 100) : 0
        }
      };

      // 3. Cachear
      await this.redis.set(cacheKey, stats, {
        namespace: 'nutrition',
        ttl: 600 // 10 minutos
      });

      return stats;
    } catch (error) {
      logger.error('Error getting supplement prescription stats:', error);
      throw error;
    }
  }

  /**
   * Busca prescrições que estão próximas do vencimento
   */
  async getExpiringPrescriptions(days: number = 7) {
    const cacheKey = `supplement-prescription:expiring:${days}`;
    
    try {
      // 1. Tentar cache
      const cached = await this.redis.get(cacheKey, {
        namespace: 'nutrition',
        ttl: 300 // 5 minutos
      });
      
      if (cached) {
        logger.info(`⚡ Cache HIT - Expiring supplement prescriptions: ${days} days`);
        return cached;
      }

      // 2. Buscar PostgreSQL
      logger.info(`🗄️ Cache MISS - Expiring supplement prescriptions: ${days} days`);
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const prescriptions = await this.prisma.supplementPrescription.findMany({
        where: {
          isActive: true,
          endDate: {
            lte: futureDate,
            gte: new Date()
          }
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
          nutritionist: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { endDate: 'asc' }
      });

      // 3. Cachear
      await this.redis.set(cacheKey, prescriptions, {
        namespace: 'nutrition',
        ttl: 300 // 5 minutos
      });

      return prescriptions;
    } catch (error) {
      logger.error('Error getting expiring supplement prescriptions:', error);
      throw error;
    }
  }

  /**
   * Gera chave de cache para busca
   */
  private generateSearchCacheKey(filters: SupplementPrescriptionFilters): string {
    const sortedFilters = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key as keyof SupplementPrescriptionFilters]}`)
      .join('|');
    
    return `supplement-prescription:search:${sortedFilters}`;
  }

  /**
   * Constrói cláusula WHERE para busca
   */
  private buildWhereClause(filters: SupplementPrescriptionFilters) {
    const where: any = {};

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.nutritionistId) {
      where.nutritionistId = filters.nutritionistId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.startDate || filters.endDate) {
      where.startDate = {};
      if (filters.startDate) {
        where.startDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.startDate.lte = filters.endDate;
      }
    }

    return where;
  }

  /**
   * Invalida cache de prescrições de suplementos
   */
  private async invalidatePrescriptionCache(clientId?: string, nutritionistId?: string) {
    try {
      if (clientId) {
        // Invalidar cache específico do cliente
        await this.redis.del(`supplement-prescription:active:${clientId}`, { namespace: 'nutrition' });
        await this.redis.invalidatePattern(`supplement-prescription:*clientId:${clientId}*`, { namespace: 'nutrition' });
      }

      if (nutritionistId) {
        // Invalidar cache específico do nutricionista
        await this.redis.invalidatePattern(`supplement-prescription:*nutritionistId:${nutritionistId}*`, { namespace: 'nutrition' });
      }

      // Invalidar cache geral
      await this.redis.invalidatePattern('supplement-prescription:search:*', { namespace: 'nutrition' });
      await this.redis.invalidatePattern('supplement-prescription:stats:*', { namespace: 'nutrition' });
      await this.redis.invalidatePattern('supplement-prescription:expiring:*', { namespace: 'nutrition' });

      logger.info('🗑️ Supplement prescription cache invalidated');
    } catch (error) {
      logger.error('Error invalidating supplement prescription cache:', error);
      // Não falhar se cache invalidation falhar
    }
  }

  /**
   * Health check do service
   */
  async healthCheck() {
    try {
      // Testar PostgreSQL
      await this.prisma.supplementPrescription.count();
      
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
export const supplementPrescriptionService = new SupplementPrescriptionService();
