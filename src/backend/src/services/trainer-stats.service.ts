import { PrismaClient } from '@prisma/client';
import { PrismaTenantWrapper } from './prisma-tenant-wrapper.service';

export class TrainerStatsService {
  private prisma: PrismaClient | PrismaTenantWrapper;

  constructor(prisma: PrismaClient | PrismaTenantWrapper) {
    this.prisma = prisma;
  }

  async getSummary(tenantId: string, trainerId: string) {
    const activeClients = await (this.prisma as any).clientTrainer.count({
      where: {
        trainerId,
        isActive: true,
        client: { tenantId, status: 'active' }
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const workoutsToday = await this.prisma.workout.count({
      where: { tenantId, userId: trainerId, createdAt: { gte: today } }
    });

    const completedToday = await this.prisma.workout.count({
      where: { tenantId, userId: trainerId, completed: true, completedAt: { gte: today } }
    });

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingAssessments = await (this.prisma as any).physicalAssessment.count({
      where: { tenantId, trainerId, assessmentDate: { gte: new Date(), lte: nextWeek } }
    });

    const totalWorkouts = await this.prisma.workout.count({ where: { tenantId, userId: trainerId } });

    return {
      activeClients,
      totalWorkouts,
      completedToday,
      stats: {
        activeClients,
        totalWorkouts,
        workoutsToday,
        completedToday,
        upcomingAssessments,
      },
      upcomingAssessments,
    };
  }

  async getAnalytics(params: { tenantId: string; trainerId: string; days: number; clientId?: string }) {
    const { tenantId, trainerId, days, clientId } = params;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    const totalClients = await (this.prisma as any).clientTrainer.count({ where: { trainerId, isActive: true } });

    const clientRelations = await (this.prisma as any).clientTrainer.findMany({
      where: { trainerId, isActive: true },
      select: { clientId: true }
    });
    const clientIds = clientRelations.map((r) => r.clientId);

    const activeClients = await this.prisma.client.count({
      where: { id: { in: clientIds }, status: 'active', tenantId }
    });

    const newClientsThisMonth = await (this.prisma as any).clientTrainer.count({ where: { trainerId } });

    const workoutFilter: any = { tenantId, createdAt: { gte: startDate } };
    if (clientId && clientId !== 'all') workoutFilter.clientId = clientId;

    const totalWorkouts = await this.prisma.workout.count({ where: workoutFilter });
    const completedWorkouts = await this.prisma.workout.count({ where: { ...workoutFilter, completed: true } });
    const averagePerWeek = totalWorkouts / (Number(days) / 7);
    const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;

    // Top exercises usando consulta raw segura
    const topExercises = await (this.prisma as any).$queryRaw<Array<{ name: string; count: bigint }>>`
      SELECT 
        e.name,
        COUNT(*) as count
      FROM "fitos"."workout" w
      CROSS JOIN LATERAL jsonb_array_elements(w.exercises::jsonb) exercise
      LEFT JOIN "fitos"."exercise" e ON e.id::text = (exercise->>'exerciseId')::text
      WHERE w."tenantId" = ${tenantId}
        AND w."createdAt" >= ${startDate}
      GROUP BY e.name
      ORDER BY count DESC
      LIMIT 5
    `;

    return {
      clients: { total: totalClients, active: activeClients, newThisMonth: newClientsThisMonth },
      workouts: { total: totalWorkouts, completed: completedWorkouts, averagePerWeek: Math.round(averagePerWeek * 100) / 100 },
      performance: {
        averageCompletionRate: completionRate,
        averageRating: 4.5,
        topExercises: topExercises.map((ex) => ({ name: ex.name, count: Number(ex.count) })),
      },
    };
  }
}
