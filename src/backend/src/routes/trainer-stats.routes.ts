import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';

const router = Router();
const prisma = new PrismaClient();

// Extend Request interface
interface RequestWithTenantAndAuth extends RequestWithTenant {
  user?: {
    id: string;
    role: string;
  };
}

// GET /api/trainer/stats - Estatísticas do trainer
router.get(
  '/',
  authMiddleware,
  tenantMiddleware,
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const trainerId = req.user!.id;
    const tenantId = req.tenantId;

    // Contar clientes ativos
    const activeClients = await prisma.clientTrainer.count({
      where: {
        trainerId,
        isActive: true,
        client: {
          tenantId,
          status: 'active'
        }
      }
    });

    // Contar treinos hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const workoutsToday = await prisma.workout.count({
      where: {
        tenantId,
        userId: trainerId,
        createdAt: {
          gte: today
        }
      }
    });

    // Contar treinos completados hoje
    const completedToday = await prisma.workout.count({
      where: {
        tenantId,
        userId: trainerId,
        completed: true,
        completedAt: {
          gte: today
        }
      }
    });

    // Contar avaliações físicas agendadas para os próximos 7 dias
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingAssessments = await prisma.physicalAssessment.count({
      where: {
        tenantId,
        trainerId,
        assessmentDate: {
          gte: new Date(),
          lte: nextWeek
        }
      }
    });

    res.json({
      success: true,
      data: {
        activeClients,
        totalWorkouts: await prisma.workout.count({
          where: {
            tenantId,
            userId: trainerId
          }
        }),
        completedToday,
        upcomingAssessments,
        stats: {
          activeClients,
          totalWorkouts: await prisma.workout.count({
            where: {
              tenantId,
              userId: trainerId
            }
          }),
          workoutsToday,
          completedToday,
          upcomingAssessments
        }
      }
    });
  })
);

// GET /api/trainer/stats/analytics - Analytics detalhadas
router.get(
  '/analytics',
  authMiddleware,
  tenantMiddleware,
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const trainerId = req.user!.id;
    const tenantId = req.tenantId;
    const { days = '30', clientId = 'all' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // Clientes
    const totalClients = await prisma.clientTrainer.count({
      where: {
        trainerId,
        tenantId,
        isActive: true
      }
    });

    const activeClients = await prisma.clientTrainer.count({
      where: {
        trainerId,
        tenantId,
        isActive: true,
        client: {
          status: 'active'
        }
      }
    });

    const newClientsThisMonth = await prisma.clientTrainer.count({
      where: {
        trainerId,
        tenantId,
        createdAt: {
          gte: new Date(new Date().setDate(1))
        }
      }
    });

    // Workouts
    const workoutFilter: any = {
      tenantId,
      createdAt: { gte: startDate }
    };

    if (clientId !== 'all') {
      workoutFilter.clientId = clientId;
    }

    const totalWorkouts = await prisma.workout.count({ where: workoutFilter });
    
    const completedWorkouts = await prisma.workout.count({
      where: {
        ...workoutFilter,
        completed: true
      }
    });

    const averagePerWeek = totalWorkouts / (Number(days) / 7);

    // Performance
    const completionRate = totalWorkouts > 0 
      ? Math.round((completedWorkouts / totalWorkouts) * 100) 
      : 0;

    // Top exercises (mais usados nos treinos)
    const topExercises = await prisma.$queryRaw<Array<{ name: string; count: bigint }>>`
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

    res.json({
      success: true,
      data: {
        clients: {
          total: totalClients,
          active: activeClients,
          newThisMonth: newClientsThisMonth
        },
        workouts: {
          total: totalWorkouts,
          completed: completedWorkouts,
          averagePerWeek: Math.round(averagePerWeek * 100) / 100
        },
        performance: {
          averageCompletionRate: completionRate,
          averageRating: 4.5, // TODO: Implementar quando tiver sistema de rating
          topExercises: topExercises.map(ex => ({
            name: ex.name,
            count: Number(ex.count)
          }))
        }
      }
    });
  })
);

export { router as trainerStatsRoutes };

