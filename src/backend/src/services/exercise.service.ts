import { PrismaClient, Exercise } from '@prisma/client';
// Tipos temporários para evitar erros de compilação após remoção da autenticação
type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'NUTRITIONIST' | 'CLIENT';
import { logger } from '../utils/logger';
import { redisService } from './redis.service';
import { generateExerciseCacheKey, generateExerciseListCacheKey, calculateTTL, hashParams } from '../utils/cache-utils';

export interface ExerciseFilters {
  search?: string;
  category?: string;
  muscleGroups?: string[];
  equipment?: string;
  difficulty?: string;
  isPublic?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExerciseFormData {
  name: string;
  description?: string;
  category: string;
  muscleGroups: string[];
  equipment?: string;
  difficulty: string;
  instructions: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  isPublic: boolean;
}

export class ExerciseService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Listar exercícios com filtros e paginação
   */
  async getExercises(filters: ExerciseFilters, tenantId: string, userRole: UserRole) {
    const {
      search,
      category,
      muscleGroups,
      equipment,
      difficulty,
      isPublic,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    // Verificar cache primeiro
    const cacheKey = generateExerciseListCacheKey(filters, tenantId);
    const cached = await redisService.get(cacheKey, {
      namespace: 'exercises',
      ttl: calculateTTL('catalog')
    });

    if (cached) {
      logger.debug(`Exercise list cache HIT for tenant ${tenantId}`);
      return cached;
    }

    logger.debug(`Exercise list cache MISS for tenant ${tenantId}`);

    const where: any = {};

    // SUPER_ADMIN pode ver todos os exercícios, outros roles precisam de tenantId
    if (userRole !== 'SUPER_ADMIN') {
      where.tenantId = tenantId;
    }

    // Filtro por busca (nome ou descrição)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtro por categoria
    if (category) {
      where.category = category;
    }

    // Filtro por grupos musculares
    if (muscleGroups && muscleGroups.length > 0) {
      where.muscleGroups = {
        array_contains: muscleGroups
      };
    }

    // Filtro por equipamento
    if (equipment) {
      where.equipment = equipment;
    }

    // Filtro por dificuldade
    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Filtro por visibilidade
    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    const skip = (page - 1) * limit;

    const [exercises, total] = await Promise.all([
      this.prisma.exercise.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          muscleGroups: true,
          equipment: true,
          difficulty: true,
          instructions: true,
          videoUrl: true,
          thumbnailUrl: true,
          isPublic: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit
      }),
      this.prisma.exercise.count({ where })
    ]);

    const result = {
      exercises,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    // Salvar no cache
    await redisService.set(cacheKey, result, {
      namespace: 'exercises',
      ttl: calculateTTL('catalog')
    });

    return result;
  }

  /**
   * Buscar exercício por ID
   */
  async getExerciseById(id: string, tenantId: string, userRole: UserRole): Promise<Exercise | null> {
    // Verificar cache primeiro
    const cacheKey = generateExerciseCacheKey(id, tenantId);
    const cached = await redisService.get<Exercise>(cacheKey, {
      namespace: 'exercises',
      ttl: calculateTTL('catalog')
    });

    if (cached) {
      logger.debug(`Exercise cache HIT for ID ${id}`);
      return cached;
    }

    logger.debug(`Exercise cache MISS for ID ${id}`);
    
    const where: any = { id, tenantId };

    // SUPER_ADMIN pode acessar qualquer tenant
    if (userRole !== 'SUPER_ADMIN') {
      // Membros só podem ver exercícios públicos
      if (userRole === 'CLIENT') {
        where.isPublic = true;
      }
    }

    const exercise = await this.prisma.exercise.findFirst({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            tenantType: true
          }
        }
      }
    });

    // Salvar no cache se encontrado
    if (exercise) {
      await redisService.set(cacheKey, exercise, {
        namespace: 'exercises',
        ttl: calculateTTL('catalog')
      });
    }

    return exercise;
  }

  /**
   * Criar novo exercício
   */
  async createExercise(exerciseData: ExerciseFormData, tenantId: string, createdBy: string): Promise<Exercise> {
    // Verificar se nome já existe no tenant
    const existingExercise = await this.prisma.exercise.findFirst({
      where: {
        name: exerciseData.name,
        tenantId
      }
    });

    if (existingExercise) {
      throw new Error('Nome do exercício já está em uso neste tenant');
    }

    const exercise = await this.prisma.exercise.create({
      data: {
        name: exerciseData.name,
        description: exerciseData.description,
        category: exerciseData.category,
        muscleGroups: exerciseData.muscleGroups,
        equipment: exerciseData.equipment,
        difficulty: exerciseData.difficulty,
        instructions: exerciseData.instructions,
        videoUrl: exerciseData.videoUrl,
        thumbnailUrl: exerciseData.thumbnailUrl,
        isPublic: exerciseData.isPublic,
        createdBy,
        tenantId
      }
    });

    // Invalidar cache de exercícios do tenant
    await this.invalidateExerciseCache(tenantId);

    logger.info(`Exercise created: ${exercise.name} in tenant ${tenantId} by ${createdBy}`);
    return exercise;
  }

  /**
   * Atualizar exercício
   */
  async updateExercise(
    id: string,
    exerciseData: Partial<ExerciseFormData>,
    tenantId: string,
    updatedBy: string
  ): Promise<Exercise> {
    // Verificar se exercício existe
    const existingExercise = await this.prisma.exercise.findFirst({
      where: { id, tenantId }
    });

    if (!existingExercise) {
      throw new Error('Exercício não encontrado');
    }

    // Verificar se nome já existe (se estiver sendo alterado)
    if (exerciseData.name && exerciseData.name !== existingExercise.name) {
      const nameExists = await this.prisma.exercise.findFirst({
        where: {
          name: exerciseData.name,
          tenantId,
          id: { not: id }
        }
      });

      if (nameExists) {
        throw new Error('Nome do exercício já está em uso neste tenant');
      }
    }

    const updateData: any = {
      ...exerciseData,
      updatedAt: new Date()
    };

    const exercise = await this.prisma.exercise.update({
      where: { id },
      data: updateData
    });

    // Invalidar cache de exercícios do tenant
    await this.invalidateExerciseCache(tenantId);

    logger.info(`Exercise updated: ${exercise.name} in tenant ${tenantId} by ${updatedBy}`);
    return exercise;
  }

  /**
   * Deletar exercício
   */
  async deleteExercise(id: string, tenantId: string, deletedBy: string): Promise<void> {
    const exercise = await this.prisma.exercise.findFirst({
      where: { id, tenantId }
    });

    if (!exercise) {
      throw new Error('Exercício não encontrado');
    }

    await this.prisma.exercise.delete({
      where: { id }
    });

    // Invalidar cache de exercícios do tenant
    await this.invalidateExerciseCache(tenantId);

    logger.info(`Exercise deleted: ${exercise.name} in tenant ${tenantId} by ${deletedBy}`);
  }

  /**
   * Buscar categorias disponíveis
   */
  async getCategories(tenantId: string): Promise<string[]> {
    const categories = await this.prisma.exercise.findMany({
      where: { tenantId },
      select: { category: true },
      distinct: ['category']
    });

    return categories.map(c => c.category);
  }

  /**
   * Buscar grupos musculares disponíveis
   */
  async getMuscleGroups(tenantId: string): Promise<string[]> {
    const exercises = await this.prisma.exercise.findMany({
      where: { tenantId },
      select: { muscleGroups: true }
    });

    const allMuscleGroups = exercises.flatMap(ex => ex.muscleGroups as string[]);
    return [...new Set(allMuscleGroups)];
  }

  /**
   * Buscar equipamentos disponíveis
   */
  async getEquipment(tenantId: string): Promise<string[]> {
    const equipment = await this.prisma.exercise.findMany({
      where: { 
        tenantId,
        equipment: { not: null }
      },
      select: { equipment: true },
      distinct: ['equipment']
    });

    return equipment.map(e => e.equipment).filter(Boolean) as string[];
  }

  /**
   * Buscar exercícios por categoria
   */
  async getExercisesByCategory(category: string, tenantId: string, userRole: UserRole): Promise<Exercise[]> {
    const where: any = {
      tenantId,
      category
    };

    // Membros só podem ver exercícios públicos
    if (userRole === 'CLIENT') {
      where.isPublic = true;
    }

    return this.prisma.exercise.findMany({
      where,
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Buscar exercícios por grupo muscular
   */
  async getExercisesByMuscleGroup(muscleGroup: string, tenantId: string, userRole: UserRole): Promise<Exercise[]> {
    const where: any = {
      tenantId,
      muscleGroups: {
        array_contains: [muscleGroup]
      }
    };

    // Membros só podem ver exercícios públicos
    if (userRole === 'CLIENT') {
      where.isPublic = true;
    }

    return this.prisma.exercise.findMany({
      where,
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Clonar exercício
   */
  async cloneExercise(id: string, newName: string, tenantId: string, clonedBy: string): Promise<Exercise> {
    const originalExercise = await this.prisma.exercise.findFirst({
      where: { id, tenantId }
    });

    if (!originalExercise) {
      throw new Error('Exercício não encontrado');
    }

    // Verificar se novo nome já existe
    const nameExists = await this.prisma.exercise.findFirst({
      where: {
        name: newName,
        tenantId
      }
    });

    if (nameExists) {
      throw new Error('Nome do exercício já está em uso neste tenant');
    }

    const clonedExercise = await this.prisma.exercise.create({
      data: {
        name: newName,
        description: originalExercise.description,
        category: originalExercise.category,
        muscleGroups: originalExercise.muscleGroups as any,
        equipment: originalExercise.equipment,
        difficulty: originalExercise.difficulty,
        instructions: originalExercise.instructions as any,
        videoUrl: originalExercise.videoUrl,
        thumbnailUrl: originalExercise.thumbnailUrl,
        isPublic: originalExercise.isPublic,
        createdBy: clonedBy,
        tenantId
      }
    });

    // Invalidar cache de exercícios do tenant
    await this.invalidateExerciseCache(tenantId);

    logger.info(`Exercise cloned: ${originalExercise.name} -> ${newName} in tenant ${tenantId} by ${clonedBy}`);
    return clonedExercise;
  }

  /**
   * Exportar exercícios para CSV
   */
  async exportExercisesToCSV(exerciseIds: string[], tenantId: string): Promise<any[]> {
    const where: any = {
      tenantId
    };

    if (exerciseIds.length > 0) {
      where.id = { in: exerciseIds };
    }

    return this.prisma.exercise.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        muscleGroups: true,
        equipment: true,
        difficulty: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Invalidar cache de exercícios do tenant
   */
  private async invalidateExerciseCache(tenantId: string): Promise<void> {
    try {
      // Invalidar cache de listas de exercícios
      await redisService.invalidatePattern(`tenant:${tenantId}:exercises:*`, {
        namespace: 'exercises'
      });
      
      // Invalidar cache de exercícios individuais do tenant
      await redisService.invalidatePattern(`tenant:${tenantId}:exercise:*`, {
        namespace: 'exercises'
      });

      logger.debug(`Exercise cache invalidated for tenant ${tenantId}`);
    } catch (error) {
      logger.error(`Error invalidating exercise cache for tenant ${tenantId}:`, error);
    }
  }
}
