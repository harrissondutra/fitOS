import { PrismaClient, ActivityLog } from '@prisma/client';
// Tipos temporários para evitar erros de compilação após remoção da autenticação
type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'CLIENT';
import { logger } from '../utils/logger';

export interface ActivityLogFilters {
  clientId?: string;
  userId?: string;
  activityType?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ActivityLogFormData {
  clientId?: string;
  userId?: string;
  activityType: string;
  description: string;
  metadata?: any;
}

export interface ClientTimeline {
  clientId: string;
  clientName: string;
  activities: Array<{
    id: string;
    activityType: string;
    description: string;
    metadata: any;
    createdAt: Date;
    userId?: string;
    userName?: string;
  }>;
  totalActivities: number;
}

export interface ActivityStats {
  totalActivities: number;
  activitiesByType: Record<string, number>;
  activitiesByDay: Record<string, number>;
  recentActivities: ActivityLog[];
  topActivityTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

export class ActivityLogService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Registrar atividade
   */
  async logActivity(activityData: ActivityLogFormData, tenantId: string): Promise<ActivityLog> {
    const activity = await this.prisma.activityLog.create({
      data: {
        tenantId,
        clientId: activityData.clientId,
        userId: activityData.userId,
        activityType: activityData.activityType,
        description: activityData.description,
        metadata: activityData.metadata || {}
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    logger.info(`Activity logged: ${activityData.activityType} - ${activityData.description} in tenant ${tenantId}`);
    return activity;
  }

  /**
   * Obter histórico de atividades com filtros
   */
  async getActivityHistory(filters: ActivityLogFilters, tenantId: string, userRole: UserRole, userId?: string) {
    const {
      clientId,
      userId: filterUserId,
      activityType,
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

    // Filtro por cliente
    if (clientId) {
      where.clientId = clientId;
    }

    // Filtro por usuário
    if (filterUserId) {
      where.userId = filterUserId;
    }

    // Filtro por tipo de atividade
    if (activityType) {
      where.activityType = activityType;
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
    if (userRole === 'TRAINER') {
      // Trainers só podem ver atividades de clientes atribuídos
      const assignedClients = await this.getAssignedClients(userId!, tenantId);
      if (assignedClients.length > 0) {
        where.clientId = { in: assignedClients };
      } else {
        // Se não tiver clientes atribuídos, retornar lista vazia
        where.clientId = { in: [] };
      }
    } else if (userRole === 'CLIENT') {
      // Clientes só podem ver próprias atividades
      where.clientId = clientId; // Assumindo que clientId é o próprio cliente
    }

    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        include: {
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
      this.prisma.activityLog.count({ where })
    ]);

    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obter timeline de atividades de um cliente
   */
  async getClientTimeline(clientId: string, tenantId: string, userRole: UserRole, userId?: string, limit: number = 50): Promise<ClientTimeline> {
    // Validação de escopo por role
    if (userRole === 'TRAINER') {
      const assignedClients = await this.getAssignedClients(userId!, tenantId);
      if (!assignedClients.includes(clientId)) {
        throw new Error('Acesso negado: cliente não atribuído');
      }
    }

    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
      select: { id: true, name: true }
    });

    if (!client) {
      throw new Error('Cliente não encontrado');
    }

    const activities = await this.prisma.activityLog.findMany({
      where: {
        tenantId,
        clientId
      },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    const totalActivities = await this.prisma.activityLog.count({
      where: {
        tenantId,
        clientId
      }
    });

    return {
      clientId: client.id,
      clientName: client.name,
      activities: activities.map(activity => ({
        id: activity.id,
        activityType: activity.activityType,
        description: activity.description,
        metadata: activity.metadata as any,
        createdAt: activity.createdAt,
        userId: activity.userId || undefined,
        userName: activity.userId ? 'Usuário' : undefined // TODO: Buscar nome do usuário
      })),
      totalActivities
    };
  }

  /**
   * Obter estatísticas de atividades
   */
  async getActivityStats(tenantId: string, userRole: UserRole, userId?: string, clientId?: string): Promise<ActivityStats> {
    const where: any = {
      tenantId
    };

    // Validação de escopo por role
    if (userRole === 'TRAINER') {
      const assignedClients = await this.getAssignedClients(userId!, tenantId);
      if (assignedClients.length > 0) {
        where.clientId = { in: assignedClients };
      } else {
        where.clientId = { in: [] };
      }
    } else if (userRole === 'CLIENT' && clientId) {
      where.clientId = clientId;
    }

    const [totalActivities, activitiesByType, recentActivities] = await Promise.all([
      this.prisma.activityLog.count({ where }),
      this.prisma.activityLog.groupBy({
        by: ['activityType'],
        where,
        _count: {
          id: true
        }
      }),
      this.prisma.activityLog.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Calcular atividades por dia (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activitiesByDay = await this.prisma.activityLog.groupBy({
      by: ['createdAt'],
      where: {
        ...where,
        createdAt: { gte: thirtyDaysAgo }
      },
      _count: {
        id: true
      }
    });

    const activitiesByDayMap: Record<string, number> = {};
    activitiesByDay.forEach(activity => {
      const day = activity.createdAt.toISOString().split('T')[0];
      activitiesByDayMap[day] = activity._count.id;
    });

    // Calcular top tipos de atividade
    const activitiesByTypeMap: Record<string, number> = {};
    activitiesByType.forEach(activity => {
      activitiesByTypeMap[activity.activityType] = activity._count.id;
    });

    const topActivityTypes = Object.entries(activitiesByTypeMap)
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalActivities > 0 ? Math.round((count / totalActivities) * 100 * 100) / 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalActivities,
      activitiesByType: activitiesByTypeMap,
      activitiesByDay: activitiesByDayMap,
      recentActivities,
      topActivityTypes
    };
  }

  /**
   * Obter atividades por tipo
   */
  async getActivitiesByType(activityType: string, tenantId: string, userRole: UserRole, userId?: string, limit: number = 50): Promise<ActivityLog[]> {
    const where: any = {
      tenantId,
      activityType
    };

    // Validação de escopo por role
    if (userRole === 'TRAINER') {
      const assignedClients = await this.getAssignedClients(userId!, tenantId);
      if (assignedClients.length > 0) {
        where.clientId = { in: assignedClients };
      } else {
        where.clientId = { in: [] };
      }
    }

    return this.prisma.activityLog.findMany({
      where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
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
   * Registrar atividade de workout
   */
  async logWorkoutActivity(clientId: string, workoutId: string, activityType: 'created' | 'completed' | 'updated', tenantId: string, userId?: string): Promise<void> {
    const descriptions = {
      created: 'Workout criado',
      completed: 'Workout completado',
      updated: 'Workout atualizado'
    };

    await this.logActivity({
      clientId,
      userId,
      activityType: `workout_${activityType}`,
      description: descriptions[activityType],
      metadata: {
        workoutId,
        timestamp: new Date().toISOString()
      }
    }, tenantId);
  }

  /**
   * Registrar atividade de exercício
   */
  async logExerciseActivity(clientId: string, exerciseId: string, activityType: 'viewed' | 'used', tenantId: string, userId?: string): Promise<void> {
    const descriptions = {
      viewed: 'Exercício visualizado',
      used: 'Exercício usado em workout'
    };

    await this.logActivity({
      clientId,
      userId,
      activityType: `exercise_${activityType}`,
      description: descriptions[activityType],
      metadata: {
        exerciseId,
        timestamp: new Date().toISOString()
      }
    }, tenantId);
  }

  /**
   * Registrar atividade de cliente
   */
  async logClientActivity(clientId: string, activityType: 'created' | 'updated' | 'assigned_trainer' | 'unassigned_trainer', tenantId: string, userId?: string, metadata?: any): Promise<void> {
    const descriptions = {
      created: 'Cliente criado',
      updated: 'Perfil do cliente atualizado',
      assigned_trainer: 'Trainer atribuído',
      unassigned_trainer: 'Trainer removido'
    };

    await this.logActivity({
      clientId,
      userId,
      activityType: `client_${activityType}`,
      description: descriptions[activityType],
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    }, tenantId);
  }

  /**
   * Exportar atividades para CSV
   */
  async exportActivitiesToCSV(activityIds: string[], tenantId: string): Promise<any[]> {
    const where: any = {
      tenantId
    };

    if (activityIds.length > 0) {
      where.id = { in: activityIds };
    }

    return this.prisma.activityLog.findMany({
      where,
      include: {
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
