import { Router } from 'express';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { getPrismaClient } from '../config/database';
import { requireRole } from '../middleware/permissions';
import { query, validationResult } from 'express-validator';
import { createAnalyticsService } from '../utils/service-factory';

const router = Router();
const prisma = getPrismaClient();
const authMiddleware = getAuthMiddleware();

// Middleware de autenticação para todas as rotas
router.use(authMiddleware.requireAuth);

/**
 * @route GET /api/analytics
 * @desc Buscar dados de analytics
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/', 
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    query('period').optional().isIn(['7', '30', '90', '365']).withMessage('Período inválido'),
  ],
  async (req: any, res) => {
    try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const period = parseInt(req.query.period || '30');
      const service = await createAnalyticsService(req);
      const analyticsData = await service.getAnalytics({
        tenantId: req.user.tenantId,
        userId: req.user.id,
        role: req.user.role,
        periodDays: period,
      });

      res.json({ success: true, data: analyticsData });
    } catch (error: any) {
      console.error('Erro ao buscar analytics:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

export default router;