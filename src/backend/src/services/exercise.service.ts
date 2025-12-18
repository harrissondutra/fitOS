import { PrismaClient, Exercise } from '@prisma/client';
import { PrismaTenantWrapper } from './prisma-tenant-wrapper.service';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';

export interface ExerciseFilters {
  search?: string;
  category?: string;
  muscleGroups?: string[];
  difficulty?: string;
  equipment?: string;
  isPublic?: boolean;
  createdBy?: string;
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
  difficulty: string;
  equipment?: string;
  instructions?: any;
  videoUrl?: string;
  thumbnailUrl?: string;
  tips?: string[];
  isPublic?: boolean;
  tags?: string[];
}

export class ExerciseService {
  constructor(private prisma: PrismaClient | PrismaTenantWrapper) { } // Aceita PrismaClient ou PrismaTenantWrapper

  /**
   * Listar exercícios com filtros
   */
  /**
   * Listar exercícios com filtros
   */
  async getExercises(filters: ExerciseFilters, tenantId: string, role?: string) {
    // IMPORTANTE: Usar getPrismaClient() (raw) para bypassar restrições
    // Exercícios são globais para todos os assinantes da aplicação
    const rawPrisma = getPrismaClient();

    // Filtros base (sem restrição de tenantId ou isPublic)
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.category) where.category = filters.category;
    if (filters.difficulty) where.difficulty = filters.difficulty;
    // Se isPublic for explicitamente passado, filtra, caso contrário não filtra mais
    if (filters.isPublic !== undefined) where.isPublic = filters.isPublic;
    // createdBy pode ser usado para filtrar "Meus Exercícios" no front, se desejado
    if (filters.createdBy) where.createdBy = filters.createdBy;

    if (filters.muscleGroups && filters.muscleGroups.length > 0) {
      where.muscleGroups = { hasSome: filters.muscleGroups };
    }

    // Paginação
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // Ordenação
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    const [exercises, total] = await Promise.all([
      rawPrisma.exercise.findMany({
        where,
        skip,
        take: limit,
        include: {
          creator: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: { [sortBy]: sortOrder }
      }),
      rawPrisma.exercise.count({ where })
    ]);

    return {
      exercises,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Buscar exercício por ID
   */
  async getExerciseById(id: string, tenantId: string): Promise<Exercise | null> {
    // Usar cliente raw para permitir acesso global a exercícios de outros tenants/admin
    const rawPrisma = getPrismaClient();
    return await rawPrisma.exercise.findUnique({
      where: { id }
    });
  }

  /**
   * Criar novo exercício
   */
  async createExercise(data: ExerciseFormData, tenantId: string, createdBy: string): Promise<Exercise> {
    const exercise = await this.prisma.exercise.create({
      data: {
        ...data,
        tenantId,
        createdBy
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    logger.info(`Exercise created: ${exercise.name} in tenant ${tenantId} by ${createdBy}`);
    return exercise;
  }

  /**
   * Atualizar exercício
   */
  async updateExercise(id: string, data: Partial<ExerciseFormData>, tenantId: string): Promise<Exercise> {
    const exercise = await this.prisma.exercise.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });

    logger.info(`Exercise updated: ${exercise.name} in tenant ${tenantId}`);
    return exercise;
  }

  /**
   * Deletar exercício
   */
  async deleteExercise(id: string, tenantId: string): Promise<void> {
    await this.prisma.exercise.delete({
      where: { id }
    });

    logger.info(`Exercise deleted: ${id} in tenant ${tenantId}`);
  }

  /**
   * Métodos stub - TODO: Implementar funcionalidades completas
   */
  async cloneExercise(id: string, tenantId: string): Promise<Exercise> {
    logger.info('Clone exercise called - not implemented yet', { id, tenantId });
    throw new Error('Method not implemented');
  }

  async getCategories(tenantId: string): Promise<string[]> {
    logger.info('Get categories called - not implemented yet', { tenantId });
    return [];
  }

  async getMuscleGroups(tenantId: string): Promise<string[]> {
    logger.info('Get muscle groups called - not implemented yet', { tenantId });
    return [];
  }

  async getEquipment(tenantId: string): Promise<string[]> {
    logger.info('Get equipment called - not implemented yet', { tenantId });
    return [];
  }

  async getExercisesByCategory(category: string, tenantId: string): Promise<Exercise[]> {
    logger.info('Get exercises by category called - not implemented yet', { category, tenantId });
    return [];
  }

  async getExercisesByMuscleGroup(muscleGroup: string, tenantId: string): Promise<Exercise[]> {
    logger.info('Get exercises by muscle group called - not implemented yet', { muscleGroup, tenantId });
    return [];
  }

  async exportExercisesToCSV(tenantId: string): Promise<string> {
    logger.info('Export exercises to CSV called - not implemented yet', { tenantId });
    return '';
  }
}
