import { PrismaClient, Workout } from '@prisma/client';
// Tipos temporários para evitar erros de compilação após remoção da autenticação
type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'CLIENT';
import { logger } from '../utils/logger';

export interface WorkoutFilters {
  search?: string;
  clientId?: string;
  userId?: string;
  completed?: boolean;
  aiGenerated?: boolean;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface WorkoutFormData {
  name: string;
  description?: string;
  exercises: any[];
  clientId: string;
  aiGenerated?: boolean;
}

export interface WorkoutStats {
  totalWorkouts: number;
  completedWorkouts: number;
  completionRate: number;
  averageWorkoutsPerWeek: number;
  mostUsedExercises: Array<{
    exerciseId: string;
    exerciseName: string;
    count: number;
  }>;
  recentWorkouts: Workout[];
}

export class WorkoutService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Listar workouts com filtros e paginação
   */
  async getWorkouts(filters: WorkoutFilters, tenantId: string, userRole: UserRole, userId?: string) {
    const {
      search,
      clientId,
      userId: filterUserId,
      completed,
      aiGenerated,
      createdFrom,
      createdTo,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const where: any = {
      tenantId
    };

    // Filtro por busca (nome ou descrição)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtro por cliente
    if (clientId) {
      where.clientId = clientId;
    }

    // Filtro por usuário
    if (filterUserId) {
      where.userId = filterUserId;
    }

    // Filtro por status de conclusão
    if (completed !== undefined) {
      where.completed = completed;
    }

    // Filtro por IA gerado
    if (aiGenerated !== undefined) {
      where.aiGenerated = aiGenerated;
    }

    // Filtro por data de criação
    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) {
        where.createdAt.gte = new Date(createdFrom);
      }
      if (createdTo) {
        where.createdAt.lte = new Date(createdTo);
      }
    }

    // Validação de escopo por role
    if (userRole === 'CLIENT') {
      // Clientes só podem ver próprios workouts
      where.userId = userId;
    } else if (userRole === 'TRAINER') {
      // Trainers podem ver workouts de clientes atribuídos
      const assignedClients = await this.getAssignedClients(userId!, tenantId);
      if (assignedClients.length > 0) {
        where.OR = [
          { userId: userId }, // Próprios workouts
          { clientId: { in: assignedClients } } // Workouts de clientes atribuídos
        ];
      } else {
        where.userId = userId; // Apenas próprios se não tiver clientes atribuídos
      }
    }

    const skip = (page - 1) * limit;

    const [workouts, total] = await Promise.all([
      this.prisma.workout.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit
      }),
      this.prisma.workout.count({ where })
    ]);

    return {
      workouts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Buscar workout por ID
   */
  async getWorkoutById(id: string, tenantId: string, userRole: UserRole, userId?: string): Promise<Workout | null> {
    const where: any = { id, tenantId };

    // Validação de escopo por role
    if (userRole === 'CLIENT') {
      where.userId = userId;
    } else if (userRole === 'TRAINER') {
      const assignedClients = await this.getAssignedClients(userId!, tenantId);
      where.OR = [
        { userId: userId },
        { clientId: { in: assignedClients } }
      ];
    }

    return this.prisma.workout.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Criar novo workout
   */
  async createWorkout(workoutData: WorkoutFormData, tenantId: string, createdBy: string): Promise<Workout> {
    // Verificar se nome já existe para o cliente
    const existingWorkout = await this.prisma.workout.findFirst({
      where: {
        name: workoutData.name,
        clientId: workoutData.clientId,
        tenantId
      }
    });

    if (existingWorkout) {
      throw new Error('Nome do workout já está em uso para este cliente');
    }

    const workout = await this.prisma.workout.create({
      data: {
        name: workoutData.name,
        description: workoutData.description,
        exercises: workoutData.exercises,
        clientId: workoutData.clientId,
        userId: createdBy,
        tenantId,
        aiGenerated: workoutData.aiGenerated || false
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    logger.info(`Workout created: ${workout.name} for client ${workoutData.clientId} in tenant ${tenantId} by ${createdBy}`);
    return workout;
  }

  /**
   * Atualizar workout
   */
  async updateWorkout(
    id: string,
    workoutData: Partial<WorkoutFormData>,
    tenantId: string,
    updatedBy: string,
    userRole: UserRole
  ): Promise<Workout> {
    // Verificar se workout existe e usuário tem permissão
    const existingWorkout = await this.getWorkoutById(id, tenantId, userRole, updatedBy);

    if (!existingWorkout) {
      throw new Error('Workout não encontrado ou acesso negado');
    }

    // Verificar se nome já existe (se estiver sendo alterado)
    if (workoutData.name && workoutData.name !== existingWorkout.name) {
      const nameExists = await this.prisma.workout.findFirst({
        where: {
          name: workoutData.name,
          clientId: existingWorkout.clientId,
          tenantId,
          id: { not: id }
        }
      });

      if (nameExists) {
        throw new Error('Nome do workout já está em uso para este cliente');
      }
    }

    const updateData: any = {
      ...workoutData,
      updatedAt: new Date()
    };

    const workout = await this.prisma.workout.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    logger.info(`Workout updated: ${workout.name} in tenant ${tenantId} by ${updatedBy}`);
    return workout;
  }

  /**
   * Deletar workout
   */
  async deleteWorkout(id: string, tenantId: string, deletedBy: string, userRole: UserRole): Promise<void> {
    // Verificar se workout existe e usuário tem permissão
    const existingWorkout = await this.getWorkoutById(id, tenantId, userRole, deletedBy);

    if (!existingWorkout) {
      throw new Error('Workout não encontrado ou acesso negado');
    }

    await this.prisma.workout.delete({
      where: { id }
    });

    logger.info(`Workout deleted: ${existingWorkout.name} in tenant ${tenantId} by ${deletedBy}`);
  }

  /**
   * Marcar workout como completo
   */
  async completeWorkout(id: string, tenantId: string, completedBy: string, userRole: UserRole, feedback?: any): Promise<Workout> {
    const existingWorkout = await this.getWorkoutById(id, tenantId, userRole, completedBy);

    if (!existingWorkout) {
      throw new Error('Workout não encontrado ou acesso negado');
    }

    if (existingWorkout.completed) {
      throw new Error('Workout já foi marcado como completo');
    }

    const workout = await this.prisma.workout.update({
      where: { id },
      data: {
        completed: true,
        completedAt: new Date(),
        feedback: feedback || {}
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    logger.info(`Workout completed: ${workout.name} in tenant ${tenantId} by ${completedBy}`);
    return workout;
  }

  /**
   * Clonar workout
   */
  async cloneWorkout(id: string, newName: string, newClientId: string, tenantId: string, clonedBy: string, userRole: UserRole): Promise<Workout> {
    const originalWorkout = await this.getWorkoutById(id, tenantId, userRole, clonedBy);

    if (!originalWorkout) {
      throw new Error('Workout não encontrado ou acesso negado');
    }

    // Verificar se novo nome já existe para o cliente
    const nameExists = await this.prisma.workout.findFirst({
      where: {
        name: newName,
        clientId: newClientId,
        tenantId
      }
    });

    if (nameExists) {
      throw new Error('Nome do workout já está em uso para este cliente');
    }

    const clonedWorkout = await this.prisma.workout.create({
      data: {
        name: newName,
        description: originalWorkout.description,
        exercises: originalWorkout.exercises as any,
        clientId: newClientId,
        userId: clonedBy,
        tenantId,
        aiGenerated: false // Clones não são considerados IA gerados
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    logger.info(`Workout cloned: ${originalWorkout.name} -> ${newName} for client ${newClientId} in tenant ${tenantId} by ${clonedBy}`);
    return clonedWorkout;
  }

  /**
   * Obter histórico de workouts de um cliente
   */
  async getWorkoutHistory(clientId: string, tenantId: string, userRole: UserRole, userId?: string, limit: number = 50): Promise<Workout[]> {
    const where: any = {
      tenantId,
      clientId
    };

    // Validação de escopo por role
    if (userRole === 'CLIENT') {
      where.userId = userId;
    } else if (userRole === 'TRAINER') {
      const assignedClients = await this.getAssignedClients(userId!, tenantId);
      if (!assignedClients.includes(clientId)) {
        throw new Error('Acesso negado: cliente não atribuído');
      }
    }

    return this.prisma.workout.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
  }

  /**
   * Obter estatísticas de workouts
   */
  async getWorkoutStats(clientId: string, tenantId: string, userRole: UserRole, userId?: string): Promise<WorkoutStats> {
    const where: any = {
      tenantId,
      clientId
    };

    // Validação de escopo por role
    if (userRole === 'CLIENT') {
      where.userId = userId;
    } else if (userRole === 'TRAINER') {
      const assignedClients = await this.getAssignedClients(userId!, tenantId);
      if (!assignedClients.includes(clientId)) {
        throw new Error('Acesso negado: cliente não atribuído');
      }
    }

    const [totalWorkouts, completedWorkouts, recentWorkouts] = await Promise.all([
      this.prisma.workout.count({ where }),
      this.prisma.workout.count({ where: { ...where, completed: true } }),
      this.prisma.workout.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    // Calcular taxa de conclusão
    const completionRate = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;

    // Calcular média de workouts por semana (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const workoutsLast30Days = await this.prisma.workout.count({
      where: {
        ...where,
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    const averageWorkoutsPerWeek = (workoutsLast30Days / 30) * 7;

    // Obter exercícios mais usados
    const allWorkouts = await this.prisma.workout.findMany({
      where,
      select: { exercises: true }
    });

    const exerciseCounts: Record<string, { name: string; count: number }> = {};
    
    allWorkouts.forEach(workout => {
      const exercises = workout.exercises as any[];
      exercises.forEach(exercise => {
        if (exercise.exerciseId) {
          if (!exerciseCounts[exercise.exerciseId]) {
            exerciseCounts[exercise.exerciseId] = {
              name: exercise.exerciseName || 'Exercício Desconhecido',
              count: 0
            };
          }
          exerciseCounts[exercise.exerciseId].count++;
        }
      });
    });

    const mostUsedExercises = Object.entries(exerciseCounts)
      .map(([exerciseId, data]) => ({
        exerciseId,
        exerciseName: data.name,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalWorkouts,
      completedWorkouts,
      completionRate: Math.round(completionRate * 100) / 100,
      averageWorkoutsPerWeek: Math.round(averageWorkoutsPerWeek * 100) / 100,
      mostUsedExercises,
      recentWorkouts
    };
  }

  /**
   * Obter clientes atribuídos a um trainer
   */
  private async getAssignedClients(trainerId: string, tenantId: string): Promise<string[]> {
    const assignments = await this.prisma.clientTrainer.findMany({
      where: {
        trainerId,
        isActive: true,
        client: {
          tenantId
        }
      },
      select: {
        clientId: true
      }
    });

    return assignments.map(a => a.clientId);
  }

  /**
   * Exportar workouts para CSV
   */
  async exportWorkoutsToCSV(workoutIds: string[], tenantId: string): Promise<any[]> {
    const where: any = {
      tenantId
    };

    if (workoutIds.length > 0) {
      where.id = { in: workoutIds };
    }

    return this.prisma.workout.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        client: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
