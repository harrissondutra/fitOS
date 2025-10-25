import { PrismaClient } from '@prisma/client';
// Tipos temporários para evitar erros de compilação após remoção da autenticação
type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'CLIENT';
import { logger } from '../utils/logger';
import { redisService } from './redis.service';
import { generateAnalyticsCacheKey, calculateTTL } from '../utils/cache-utils';

export interface AnalyticsPeriod {
  start: Date;
  end: Date;
  label: string;
}

export interface TenantAnalytics {
  // Métricas gerais
  totalMembers: number;
  totalWorkouts: number;
  totalExercises: number;
  totalActivities: number;
  
  // Métricas de engajamento
  activeMembers: number;
  completedWorkouts: number;
  completionRate: number;
  averageWorkoutsPerMember: number;
  
  // Métricas de retenção
  newMembersThisMonth: number;
  retainedMembers: number;
  retentionRate: number;
  
  // Métricas de uso
  workoutsThisMonth: number;
  activitiesThisMonth: number;
  topExerciseTypes: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  
  // Tendências temporais
  clientGrowth: Array<{
    date: string;
    count: number;
  }>;
  workoutTrends: Array<{
    date: string;
    count: number;
  }>;
  activityTrends: Array<{
    date: string;
    count: number;
  }>;
}

export interface TrainerAnalytics {
  trainerId: string;
  trainerName: string;
  
  // Métricas de membros
  assignedMembers: number;
  activeMembers: number;
  
  // Métricas de workouts
  totalWorkouts: number;
  completedWorkouts: number;
  completionRate: number;
  
  // Métricas de atividades
  totalActivities: number;
  activitiesThisMonth: number;
  
  // Métricas de performance
  averageWorkoutsPerMember: number;
  topPerformingMembers: Array<{
    clientId: string;
    clientName: string;
    workoutsCompleted: number;
    completionRate: number;
  }>;
  
  // Tendências
  monthlyProgress: Array<{
    month: string;
    workouts: number;
    activities: number;
    clients: number;
  }>;
}

export interface MemberAnalytics {
  clientId: string;
  clientName: string;
  
  // Métricas de workouts
  totalWorkouts: number;
  completedWorkouts: number;
  completionRate: number;
  averageWorkoutsPerWeek: number;
  
  // Métricas de atividades
  totalActivities: number;
  activitiesThisMonth: number;
  
  // Métricas de progresso
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate?: Date;
  
  // Métricas de exercícios
  uniqueExercisesUsed: number;
  mostUsedExercises: Array<{
    exerciseId: string;
    exerciseName: string;
    count: number;
  }>;
  
  // Tendências
  weeklyProgress: Array<{
    week: string;
    workouts: number;
    activities: number;
  }>;
}

export interface GlobalAnalytics {
  // Métricas globais
  totalTenants: number;
  totalUsers: number;
  totalMembers: number;
  totalWorkouts: number;
  totalExercises: number;
  
  // Métricas de crescimento
  newTenantsThisMonth: number;
  newUsersThisMonth: number;
  newMembersThisMonth: number;
  
  // Métricas de uso
  activeTenants: number;
  activeUsers: number;
  activeMembers: number;
  
  // Métricas de planos
  planDistribution: Array<{
    plan: string;
    count: number;
    percentage: number;
  }>;
  
  // Tendências globais
  tenantGrowth: Array<{
    date: string;
    count: number;
  }>;
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
  workoutGrowth: Array<{
    date: string;
    count: number;
  }>;
}

export class AnalyticsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Obter analytics de um tenant
   */
  async getTenantAnalytics(tenantId: string, period: string = '30d'): Promise<TenantAnalytics> {
    // Verificar cache primeiro
    const cacheKey = generateAnalyticsCacheKey('tenant', tenantId, period);
    const cached = await redisService.get<TenantAnalytics>(cacheKey, {
      namespace: 'analytics',
      ttl: calculateTTL('analytics')
    });

    if (cached) {
      logger.debug(`Analytics cache HIT for tenant ${tenantId}, period ${period}`);
      return cached;
    }

    logger.debug(`Analytics cache MISS for tenant ${tenantId}, period ${period}`);
    const { start, end } = this.getPeriodDates(period);
    
    // Métricas gerais
    const [totalMembers, totalWorkouts, totalExercises, totalActivities] = await Promise.all([
      this.prisma.client.count({ where: { tenantId } }),
      this.prisma.workout.count({ where: { tenantId } }),
      this.prisma.exercise.count({ where: { tenantId } }),
      this.prisma.activityLog.count({ where: { tenantId } })
    ]);

    // Métricas de engajamento
    const [activeMembers, completedWorkouts] = await Promise.all([
      this.getActiveMembers(tenantId, start, end),
      this.prisma.workout.count({ where: { tenantId, completed: true } })
    ]);

    const completionRate = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;
    const averageWorkoutsPerMember = totalMembers > 0 ? totalWorkouts / totalMembers : 0;

    // Métricas de retenção
    const [newMembersThisMonth, retainedMembers] = await Promise.all([
      this.prisma.client.count({
        where: {
          tenantId,
          createdAt: { gte: start }
        }
      }),
      this.getRetainedMembers(tenantId, start, end)
    ]);

    const retentionRate = totalMembers > 0 ? (retainedMembers / totalMembers) * 100 : 0;

    // Métricas de uso do período
    const [workoutsThisMonth, activitiesThisMonth] = await Promise.all([
      this.prisma.workout.count({
        where: {
          tenantId,
          createdAt: { gte: start, lte: end }
        }
      }),
      this.prisma.activityLog.count({
        where: {
          tenantId,
          createdAt: { gte: start, lte: end }
        }
      })
    ]);

    // Top tipos de exercícios
    const exerciseTypes = await this.prisma.exercise.groupBy({
      by: ['category'],
      where: { tenantId },
      _count: { id: true }
    });

    const topExerciseTypes = exerciseTypes
      .map(type => ({
        type: type.category,
        count: type._count.id,
        percentage: totalExercises > 0 ? Math.round((type._count.id / totalExercises) * 100 * 100) / 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Tendências temporais
    const [clientGrowth, workoutTrends, activityTrends] = await Promise.all([
      this.getMemberGrowthTrend(tenantId, start, end),
      this.getWorkoutTrend(tenantId, start, end),
      this.getActivityTrend(tenantId, start, end)
    ]);

    const result = {
      totalMembers,
      totalWorkouts,
      totalExercises,
      totalActivities,
      activeMembers,
      completedWorkouts,
      completionRate: Math.round(completionRate * 100) / 100,
      averageWorkoutsPerMember: Math.round(averageWorkoutsPerMember * 100) / 100,
      newMembersThisMonth,
      retainedMembers,
      retentionRate: Math.round(retentionRate * 100) / 100,
      workoutsThisMonth,
      activitiesThisMonth,
      topExerciseTypes,
      clientGrowth,
      workoutTrends,
      activityTrends
    };

    // Salvar no cache
    await redisService.set(cacheKey, result, {
      namespace: 'analytics',
      ttl: calculateTTL('analytics')
    });

    return result;
  }

  /**
   * Obter analytics de um trainer
   */
  async getTrainerAnalytics(trainerId: string, tenantId: string, period: string = '30d'): Promise<TrainerAnalytics> {
    // Verificar cache primeiro
    const cacheKey = generateAnalyticsCacheKey('trainer', trainerId, period, tenantId);
    const cached = await redisService.get<TrainerAnalytics>(cacheKey, {
      namespace: 'analytics',
      ttl: calculateTTL('analytics')
    });

    if (cached) {
      logger.debug(`Analytics cache HIT for trainer ${trainerId}, period ${period}`);
      return cached;
    }

    logger.debug(`Analytics cache MISS for trainer ${trainerId}, period ${period}`);
    const { start, end } = this.getPeriodDates(period);

    // Obter dados do trainer
    const trainer = await this.prisma.user.findFirst({
      where: { id: trainerId, tenantId },
      select: { firstName: true, lastName: true }
    });

    if (!trainer) {
      throw new Error('Trainer não encontrado');
    }

    // Obter membros atribuídos
    const assignedMembers = await this.prisma.clientTrainer.findMany({
      where: {
        trainerId,
        isActive: true,
        client: { tenantId }
      },
      include: {
        client: {
          select: { id: true, name: true }
        }
      }
    });

    const clientIds = assignedMembers.map(a => a.clientId);

    // Métricas de membros
    const assignedMembersCount = assignedMembers.length;
    const activeMembers = await this.getActiveMembers(tenantId, start, end, clientIds);

    // Métricas de workouts
    const [totalWorkouts, completedWorkouts] = await Promise.all([
      this.prisma.workout.count({
        where: {
          tenantId,
          clientId: { in: clientIds }
        }
      }),
      this.prisma.workout.count({
        where: {
          tenantId,
          clientId: { in: clientIds },
          completed: true
        }
      })
    ]);

    const completionRate = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;

    // Métricas de atividades
    const [totalActivities, activitiesThisMonth] = await Promise.all([
      this.prisma.activityLog.count({
        where: {
          tenantId,
          clientId: { in: clientIds }
        }
      }),
      this.prisma.activityLog.count({
        where: {
          tenantId,
          clientId: { in: clientIds },
          createdAt: { gte: start, lte: end }
        }
      })
    ]);

    const averageWorkoutsPerMember = assignedMembersCount > 0 ? totalWorkouts / assignedMembersCount : 0;

    // Top membros por performance
    const clientPerformance = await Promise.all(
      assignedMembers.map(async (assignment) => {
        const clientWorkouts = await this.prisma.workout.count({
          where: {
            tenantId,
            clientId: assignment.clientId
          }
        });

        const clientCompletedWorkouts = await this.prisma.workout.count({
          where: {
            tenantId,
            clientId: assignment.clientId,
            completed: true
          }
        });

        return {
          clientId: assignment.clientId,
          clientName: assignment.client.name,
          workoutsCompleted: clientCompletedWorkouts,
          completionRate: clientWorkouts > 0 ? (clientCompletedWorkouts / clientWorkouts) * 100 : 0
        };
      })
    );

    const topPerformingMembers = clientPerformance
      .sort((a, b) => b.workoutsCompleted - a.workoutsCompleted)
      .slice(0, 5);

    // Progresso mensal
    const monthlyProgress = await this.getMonthlyProgress(tenantId, clientIds, start, end);

    const result = {
      trainerId,
      trainerName: `${trainer.firstName} ${trainer.lastName}`,
      assignedMembers: assignedMembersCount,
      activeMembers,
      totalWorkouts,
      completedWorkouts,
      completionRate: Math.round(completionRate * 100) / 100,
      totalActivities,
      activitiesThisMonth,
      averageWorkoutsPerMember: Math.round(averageWorkoutsPerMember * 100) / 100,
      topPerformingMembers,
      monthlyProgress
    };

    // Salvar no cache
    await redisService.set(cacheKey, result, {
      namespace: 'analytics',
      ttl: calculateTTL('analytics')
    });

    return result;
  }

  /**
   * Obter analytics de um membro
   */
  async getMemberAnalytics(clientId: string, tenantId: string, period: string = '30d'): Promise<MemberAnalytics> {
    // Verificar cache primeiro
    const cacheKey = generateAnalyticsCacheKey('member', clientId, period, tenantId);
    const cached = await redisService.get<MemberAnalytics>(cacheKey, {
      namespace: 'analytics',
      ttl: calculateTTL('analytics')
    });

    if (cached) {
      logger.debug(`Analytics cache HIT for member ${clientId}, period ${period}`);
      return cached;
    }

    logger.debug(`Analytics cache MISS for member ${clientId}, period ${period}`);
    const { start, end } = this.getPeriodDates(period);

    // Obter dados do membro
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
      select: { name: true }
    });

    if (!client) {
      throw new Error('Membro não encontrado');
    }

    // Métricas de workouts
    const [totalWorkouts, completedWorkouts] = await Promise.all([
      this.prisma.workout.count({
        where: { tenantId, clientId }
      }),
      this.prisma.workout.count({
        where: { tenantId, clientId, completed: true }
      })
    ]);

    const completionRate = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;

    // Calcular média de workouts por semana
    const workoutsInPeriod = await this.prisma.workout.count({
      where: {
        tenantId,
        clientId,
        createdAt: { gte: start, lte: end }
      }
    });

    const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const averageWorkoutsPerWeek = (workoutsInPeriod / daysInPeriod) * 7;

    // Métricas de atividades
    const [totalActivities, activitiesThisMonth] = await Promise.all([
      this.prisma.activityLog.count({
        where: { tenantId, clientId }
      }),
      this.prisma.activityLog.count({
        where: {
          tenantId,
          clientId,
          createdAt: { gte: start, lte: end }
        }
      })
    ]);

    // Calcular streaks
    const [currentStreak, longestStreak, lastWorkoutDate] = await this.getWorkoutStreaks(tenantId, clientId);

    // Exercícios únicos usados
    const workouts = await this.prisma.workout.findMany({
      where: { tenantId, clientId },
      select: { exercises: true }
    });

    const uniqueExercises = new Set<string>();
    const exerciseCounts: Record<string, number> = {};

    workouts.forEach(workout => {
      const exercises = workout.exercises as any[];
      exercises.forEach(exercise => {
        if (exercise.exerciseId) {
          uniqueExercises.add(exercise.exerciseId);
          exerciseCounts[exercise.exerciseId] = (exerciseCounts[exercise.exerciseId] || 0) + 1;
        }
      });
    });

    const mostUsedExercises = Object.entries(exerciseCounts)
      .map(([exerciseId, count]) => ({
        exerciseId,
        exerciseName: 'Exercício', // TODO: Buscar nome do exercício
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Progresso semanal
    const weeklyProgress = await this.getWeeklyProgress(tenantId, clientId, start, end);

    const result = {
      clientId,
      clientName: client.name,
      totalWorkouts,
      completedWorkouts,
      completionRate: Math.round(completionRate * 100) / 100,
      averageWorkoutsPerWeek: Math.round(averageWorkoutsPerWeek * 100) / 100,
      totalActivities,
      activitiesThisMonth,
      currentStreak,
      longestStreak,
      lastWorkoutDate,
      uniqueExercisesUsed: uniqueExercises.size,
      mostUsedExercises,
      weeklyProgress
    };

    // Salvar no cache
    await redisService.set(cacheKey, result, {
      namespace: 'analytics',
      ttl: calculateTTL('analytics')
    });

    return result;
  }

  /**
   * Obter analytics globais (Super Admin)
   */
  async getGlobalAnalytics(period: string = '30d'): Promise<GlobalAnalytics> {
    // Verificar cache primeiro
    const cacheKey = generateAnalyticsCacheKey('global', 'global', period);
    const cached = await redisService.get<GlobalAnalytics>(cacheKey, {
      namespace: 'analytics',
      ttl: calculateTTL('analytics')
    });

    if (cached) {
      logger.debug(`Analytics cache HIT for global, period ${period}`);
      return cached;
    }

    logger.debug(`Analytics cache MISS for global, period ${period}`);
    const { start, end } = this.getPeriodDates(period);

    // Métricas globais
    const [totalTenants, totalUsers, totalMembers, totalWorkouts, totalExercises] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.user.count(),
      this.prisma.client.count(),
      this.prisma.workout.count(),
      this.prisma.exercise.count()
    ]);

    // Métricas de crescimento
    const [newTenantsThisMonth, newUsersThisMonth, newMembersThisMonth] = await Promise.all([
      this.prisma.tenant.count({
        where: { createdAt: { gte: start } }
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: start } }
      }),
      this.prisma.client.count({
        where: { createdAt: { gte: start } }
      })
    ]);

    // Métricas de uso
    const [activeTenants, activeUsers, activeMembers] = await Promise.all([
      this.getActiveTenants(start, end),
      this.getActiveUsers(start, end),
      this.getActiveMembersGlobally(start, end)
    ]);

    // Distribuição de planos
    const planDistribution = await this.prisma.tenant.groupBy({
      by: ['plan'],
      _count: { id: true }
    });

    const planDistributionFormatted = planDistribution.map(plan => ({
      plan: plan.plan,
      count: plan._count.id,
      percentage: totalTenants > 0 ? Math.round((plan._count.id / totalTenants) * 100 * 100) / 100 : 0
    }));

    // Tendências globais
    const [tenantGrowth, userGrowth, workoutGrowth] = await Promise.all([
      this.getGlobalTenantGrowth(start, end),
      this.getGlobalUserGrowth(start, end),
      this.getGlobalWorkoutGrowth(start, end)
    ]);

    const result = {
      totalTenants,
      totalUsers,
      totalMembers,
      totalWorkouts,
      totalExercises,
      newTenantsThisMonth,
      newUsersThisMonth,
      newMembersThisMonth,
      activeTenants,
      activeUsers,
      activeMembers,
      planDistribution: planDistributionFormatted,
      tenantGrowth,
      userGrowth,
      workoutGrowth
    };

    // Salvar no cache
    await redisService.set(cacheKey, result, {
      namespace: 'analytics',
      ttl: calculateTTL('analytics')
    });

    return result;
  }

  // Métodos auxiliares privados

  private getPeriodDates(period: string): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }

    return { start, end };
  }

  private async getActiveMembers(tenantId: string, start: Date, end: Date, clientIds?: string[]): Promise<number> {
    const where: any = {
      tenantId,
      createdAt: { gte: start, lte: end }
    };

    if (clientIds) {
      where.clientId = { in: clientIds };
    }

    const activeMembers = await this.prisma.activityLog.groupBy({
      by: ['clientId'],
      where,
      _count: { id: true }
    });

    return activeMembers.length;
  }

  private async getRetainedMembers(tenantId: string, start: Date, end: Date): Promise<number> {
    // Membros que tiveram atividade no período
    const activeMembers = await this.prisma.activityLog.groupBy({
      by: ['clientId'],
      where: {
        tenantId,
        createdAt: { gte: start, lte: end }
      },
      _count: { id: true }
    });

    return activeMembers.length;
  }

  private async getMemberGrowthTrend(tenantId: string, start: Date, end: Date): Promise<Array<{ date: string; count: number }>> {
    // Implementar agregação por dia
    return [];
  }

  private async getWorkoutTrend(tenantId: string, start: Date, end: Date): Promise<Array<{ date: string; count: number }>> {
    // Implementar agregação por dia
    return [];
  }

  private async getActivityTrend(tenantId: string, start: Date, end: Date): Promise<Array<{ date: string; count: number }>> {
    // Implementar agregação por dia
    return [];
  }

  private async getMonthlyProgress(tenantId: string, clientIds: string[], start: Date, end: Date): Promise<Array<{ month: string; workouts: number; activities: number; clients: number }>> {
    // Implementar agregação mensal
    return [];
  }

  private async getWorkoutStreaks(tenantId: string, clientId: string): Promise<[number, number, Date?]> {
    // Implementar cálculo de streaks
    return [0, 0, undefined];
  }

  private async getWeeklyProgress(tenantId: string, clientId: string, start: Date, end: Date): Promise<Array<{ week: string; workouts: number; activities: number }>> {
    // Implementar agregação semanal
    return [];
  }

  private async getActiveTenants(start: Date, end: Date): Promise<number> {
    // Implementar cálculo de tenants ativos
    return 0;
  }

  private async getActiveUsers(start: Date, end: Date): Promise<number> {
    // Implementar cálculo de usuários ativos
    return 0;
  }

  private async getActiveMembersGlobally(start: Date, end: Date): Promise<number> {
    // Implementar cálculo de membros ativos globalmente
    return 0;
  }

  private async getGlobalTenantGrowth(start: Date, end: Date): Promise<Array<{ date: string; count: number }>> {
    // Implementar crescimento global de tenants
    return [];
  }

  private async getGlobalUserGrowth(start: Date, end: Date): Promise<Array<{ date: string; count: number }>> {
    // Implementar crescimento global de usuários
    return [];
  }

  private async getGlobalWorkoutGrowth(start: Date, end: Date): Promise<Array<{ date: string; count: number }>> {
    // Implementar crescimento global de workouts
    return [];
  }
}


