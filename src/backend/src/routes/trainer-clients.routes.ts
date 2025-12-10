import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';
import { getPrismaClient } from '../config/database';
import { createTrainerClientsService } from '../utils/service-factory';

type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'NUTRITIONIST' | 'CLIENT';

const prisma = getPrismaClient();
const router = Router();

interface RequestWithTenantAndAuth extends RequestWithTenant {
  user?: {
    id: string;
    email: string;
    role: any;
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
    const service = await createTrainerClientsService(req);
    const clients = await service.getAssignedClients(tenantId!, userId);
    logger.info(`Trainer ${userId} fetched ${clients.length} clients`);
    res.json({ success: true, data: clients });
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
    const service = await createTrainerClientsService(req);
    const stats = await service.getClientStats(tenantId!, userId, clientId);
    if (!stats) {
      return res.status(404).json({ success: false, error: 'Client not found or not assigned to this trainer' });
    }
    res.json({ success: true, data: stats });
  } catch (error: any) {
    logger.error('Error fetching client stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client stats'
    });
  }
}));

export { router as trainerClientsRoutes };

