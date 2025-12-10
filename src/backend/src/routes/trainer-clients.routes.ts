import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';
import { PrismaClient } from '@prisma/client';

type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'NUTRITIONIST' | 'CLIENT';

const prisma = new PrismaClient();
const router = Router();

interface RequestWithTenantAndAuth extends RequestWithTenant {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    tenantId?: string;
    name?: string;
  };
}

/**
 * GET /api/trainer/clients
 * Listar clientes atribuídos ao trainer
 */
router.get('/clients', asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
  const userId = req.user?.id;
  const tenantId = req.tenantId;

  if (!userId || !tenantId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }

  if (req.user?.role !== 'TRAINER') {
    return res.status(403).json({
      success: false,
      error: 'Only trainers can access this endpoint'
    });
  }

  try {
    // Buscar clientes através do relacionamento ClientTrainer
    const clientTrainerRelations = await prisma.clientTrainer.findMany({
      where: {
        trainerId: userId,
        tenantId: tenantId
      },
      include: {
        client: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    // Transformar dados para formato esperado
    const clients = clientTrainerRelations.map(relation => ({
      id: relation.client.id,
      name: `${relation.client.user.firstName} ${relation.client.user.lastName}`,
      email: relation.client.user.email,
      phone: relation.client.user.phone,
      membershipType: relation.client.membershipType || 'Standard',
      status: relation.client.status || 'active',
      userId: relation.client.userId,
      tenantId: relation.client.tenantId,
      createdAt: relation.client.createdAt,
      updatedAt: relation.client.updatedAt
    }));

    logger.info(`Trainer ${userId} fetched ${clients.length} clients`);

    res.json({
      success: true,
      data: clients
    });
  } catch (error: any) {
    logger.error('Error fetching trainer clients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clients'
    });
  }
}));

/**
 * GET /api/trainer/clients/:clientId/stats
 * Estatísticas de um cliente específico
 */
router.get('/clients/:clientId/stats', asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
  const userId = req.user?.id;
  const tenantId = req.tenantId;
  const { clientId } = req.params;

  if (!userId || !tenantId) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized'
    });
  }

  try {
    // Verificar se o cliente pertence ao trainer
    const relation = await prisma.clientTrainer.findFirst({
      where: {
        trainerId: userId,
        clientId: clientId,
        tenantId: tenantId
      }
    });

    if (!relation) {
      return res.status(404).json({
        success: false,
        error: 'Client not found or not assigned to this trainer'
      });
    }

    // Buscar estatísticas do cliente
    const [totalWorkouts, completedWorkouts, pendingAssessments] = await Promise.all([
      prisma.workout.count({
        where: {
          clientId: clientId,
          tenantId: tenantId
        }
      }),
      prisma.workout.count({
        where: {
          clientId: clientId,
          tenantId: tenantId,
          completed: true
        }
      }),
      prisma.physicalAssessment.count({
        where: {
          clientId: clientId,
          tenantId: tenantId
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalWorkouts,
        completedWorkouts,
        completionRate: totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0,
        pendingAssessments,
        activePrograms: 0 // TODO: implementar
      }
    });
  } catch (error: any) {
    logger.error('Error fetching client stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client stats'
    });
  }
}));

export { router as trainerClientsRoutes };

