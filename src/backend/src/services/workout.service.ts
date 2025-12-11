import { PrismaClient, Workout } from '@prisma/client';
import { PrismaTenantWrapper } from './prisma-tenant-wrapper.service';
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
  constructor(private prisma: PrismaClient | PrismaTenantWrapper) { }

  /**
   * Helper para garantir que existe um registro de Client para um User
   * Essencial para SuperAdmin testando funcionalidades de usuário
   */
  private async ensureClientForUser(userId: string, tenantId: string): Promise<string> {
    // 1. Tentar encontrar cliente pelo userId
    const existingClient = await this.prisma.client.findUnique({
      where: { userId }
    });

    if (existingClient) {
      return existingClient.id;
    }

    // 2. Se não existir, criar um novo Client para este User
    // Precisamos buscar dados do usuário primeiro para preencher o Client
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error(`Usuário ${userId} não encontrado para criar perfil de cliente`);
    }

    const newClient = await this.prisma.client.create({
      data: {
        userId: user.id,
        tenantId: tenantId, // Usa o tenant atual do contexto
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        email: user.email,
        phone: user.phone,
        membershipType: 'basic', // Default
        status: 'active'
      }
    });

    logger.info(`Auto-created Client profile for User ${userId} (SuperAdmin/Test) - ClientID: ${newClient.id}`);
    return newClient.id;
  }

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

    // Filtro por cliente (com resolução inteligente para userId)
    if (clientId) {
      // Se o clientId passado parecer ser o próprio userId (comum no frontend), 
      // ou se o usuário for o próprio solicitante, tentamos resolver o ID real do cliente
      if (clientId === userId) {
        try {
          const realClientId = await this.ensureClientForUser(userId!, tenantId);
          where.clientId = realClientId;
        } catch (e) {
          // Se falhar (ex: usuario nao existe), mantem o filtro original que vai retornar vazio
          where.clientId = clientId;
        }
      } else {
        // Tenta achar direto, se não achar e for uuid válido, tenta achar pelo userId
        const clientExists = await this.prisma.client.findUnique({ where: { id: clientId } });
        if (clientExists) {
          where.clientId = clientId;
        } else {
          const clientByUser = await this.prisma.client.findUnique({ where: { userId: clientId } });
          if (clientByUser) {
            where.clientId = clientByUser.id;
          } else {
            where.clientId = clientId;
          }
        }
      }
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
    // Resolução inteligente de clientId
    let realClientId = workoutData.clientId;

    // Se estiver criando para si mesmo (admin testando), garante que existe perfil de cliente
    if (workoutData.clientId === createdBy) {
      realClientId = await this.ensureClientForUser(createdBy, tenantId);
    }
    // Se não for id de cliente válido, tenta ver se é user id
    else {
      const clientExists = await this.prisma.client.findUnique({ where: { id: workoutData.clientId } });
      if (!clientExists) {
        const clientByUser = await this.prisma.client.findUnique({ where: { userId: workoutData.clientId } });
        if (clientByUser) {
          realClientId = clientByUser.id;
        }
      }
    }

    // Verificar se nome já existe para o cliente
    const existingWorkout = await this.prisma.workout.findFirst({
      where: {
        name: workoutData.name,
        clientId: realClientId,
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
        clientId: realClientId,
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

    logger.info(`Workout created: ${workout.name} for client ${realClientId} in tenant ${tenantId} by ${createdBy}`);
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

    // Se clientId foi atualizado, tome cuidado, mas aqui assumimos que se veio do front já é o ID correto
    // ou não deve ser atualizado levianamente.

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

    // Resolução de Client ID
    let realClientId = newClientId;

    // Se id = user id do chamador, resolver
    if (newClientId === clonedBy) {
      try {
        realClientId = await this.ensureClientForUser(clonedBy, tenantId);
      } catch (e) {
        logger.warn(`Falha ao resolver client para user ${clonedBy} no clone: ${e}`);
      }
    } else {
      // Tentar achar pelo user id se nao for client id
      const clientExists = await this.prisma.client.findUnique({ where: { id: newClientId } });
      if (!clientExists) {
        const clientByUser = await this.prisma.client.findUnique({ where: { userId: newClientId } });
        if (clientByUser) realClientId = clientByUser.id;
      }
    }

    // Verificar se novo nome já existe para o cliente
    const nameExists = await this.prisma.workout.findFirst({
      where: {
        name: newName,
        clientId: realClientId,
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
        clientId: realClientId,
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

    logger.info(`Workout cloned: ${originalWorkout.name} -> ${newName} for client ${realClientId} in tenant ${tenantId} by ${clonedBy}`);
    return clonedWorkout;
  }

  /**
   * Obter histórico de workouts de um cliente
   */
  async getWorkoutHistory(clientId: string, tenantId: string, userRole: UserRole, userId?: string, limit: number = 50): Promise<Workout[]> {
    let resolvedClientId = clientId;

    // Resolver user id -> client id
    if (clientId === userId) {
      try {
        resolvedClientId = await this.ensureClientForUser(userId!, tenantId);
      } catch (e) { /* ignore */ }
    } else {
      const c = await this.prisma.client.findUnique({ where: { userId: clientId } });
      if (c) resolvedClientId = c.id;
    }

    const where: any = {
      tenantId,
      clientId: resolvedClientId
    };

    // Validação de escopo por role
    if (userRole === 'CLIENT') {
      where.userId = userId;
    } else if (userRole === 'TRAINER') {
      const assignedClients = await this.getAssignedClients(userId!, tenantId);
      if (!assignedClients.includes(resolvedClientId)) {
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
    let resolvedClientId = clientId;
    // Resolver user id -> client id
    if (clientId === userId) {
      try {
        resolvedClientId = await this.ensureClientForUser(userId!, tenantId);
      } catch (e) { /* ignore */ }
    } else {
      const c = await this.prisma.client.findUnique({ where: { userId: clientId } });
      if (c) resolvedClientId = c.id;
    }

    const where: any = {
      tenantId,
      clientId: resolvedClientId
    };

    // Validação de escopo por role
    if (userRole === 'CLIENT') {
      where.userId = userId;
    } else if (userRole === 'TRAINER') {
      const assignedClients = await this.getAssignedClients(userId!, tenantId);
      if (!assignedClients.includes(resolvedClientId)) {
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
    const assignments = await (this.prisma as any).clientTrainer.findMany({
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

    return assignments.map((a: any) => a.clientId);
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
