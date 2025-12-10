import { Router, Request, Response } from 'express';
import { getPrismaClient } from '../config/database';
import { authenticateToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';
import { UserRole } from '../../../shared/types/auth.types';

const router = Router();
const prisma = getPrismaClient();
import { createTrainerStatsService } from '../utils/service-factory';

// Extend Request interface
interface RequestWithTenantAndAuth extends RequestWithTenant {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    tenantId?: string;
    name?: string;
  };
}

// GET /api/trainer/stats - Estatísticas do trainer
router.get(
  '/',
  authenticateToken,
  tenantMiddleware,
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const trainerId = req.user!.id;
    const tenantId = req.tenantId;

    const service = await createTrainerStatsService(req);
    const data = await service.getSummary(tenantId!, trainerId);
    res.json({ success: true, data });
  })
);

// GET /api/trainer/stats/analytics - Analytics detalhadas
router.get(
  '/analytics',
  authenticateToken,
  tenantMiddleware,
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const trainerId = req.user!.id;
    const tenantId = req.tenantId;
    const { days = '30', clientId = 'all' } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));

    // Clientes
    const service = await createTrainerStatsService(req);
    const data = await service.getAnalytics({ tenantId: tenantId!, trainerId, days: Number(days), clientId: clientId as string });
    res.json({ success: true, data });
  })
);

export { router as trainerStatsRoutes };

