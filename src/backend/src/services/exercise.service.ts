import { PrismaClient, Exercise } from '@prisma/client';
import { logger } from '../utils/logger';

export interface ExerciseFilters {
  search?: string;
  category?: string;
  muscleGroups?: string[];
  difficulty?: string;
  equipment?: string;
  isPublic?: boolean;
  createdBy?: string;
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
  constructor(private prisma: PrismaClient) {}

  /**
   * Listar exercícios com filtros
   */
  async getExercises(filters: ExerciseFilters, tenantId: string) {
    const where: any = { tenantId };
    
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    if (filters.category) where.category = filters.category;
    if (filters.difficulty) where.difficulty = filters.difficulty;
    if (filters.isPublic !== undefined) where.isPublic = filters.isPublic;
    if (filters.createdBy) where.createdBy = filters.createdBy;
    
    if (filters.muscleGroups && filters.muscleGroups.length > 0) {
      where.muscleGroups = { hasSome: filters.muscleGroups };
    }
    
    return await this.prisma.exercise.findMany({
      where,
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Buscar exercício por ID
   */
  async getExerciseById(id: string, tenantId: string): Promise<Exercise | null> {
    return await this.prisma.exercise.findFirst({
      where: { id, tenantId }
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
}
