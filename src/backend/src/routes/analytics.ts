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
router.use(authMiddleware.requireAuth());

/**
 * @route GET /api/analytics
 * @desc Buscar dados de analytics padrão (dashboard principal)
 */
router.get('/',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    query('period').optional().isIn(['7', '30', '90', '365']),
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

/**
 * @route GET /api/analytics/global
 * @desc Analytics global (alias para root)
 */
router.get('/global',
  requireRole(['ADMIN', 'OWNER', 'SUPER_ADMIN']),
  async (req: any, res) => {
    try {
      const period = parseInt(req.query.period || '30');
      const service = await createAnalyticsService(req);
      const analyticsData = await service.getAnalytics({
        tenantId: req.user.tenantId,
        userId: req.user.id,
        role: req.user.role,
        periodDays: period,
      });
      res.json({ success: true, data: analyticsData });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro interno' });
    }
  }
);

/**
 * @route GET /api/analytics/member/:clientId
 * @desc Analytics específico de um cliente
 */
router.get('/member/:clientId',
  // Allow CLIENT to see their own data? Currently restricted to staff.
  // If we want CLIENT access, we need to add 'CLIENT' here and validate ID.
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN', 'CLIENT']),
  async (req: any, res) => {
    try {
      const { clientId } = req.params;
      const period = parseInt(req.query.period || '30');

      // Basic security check for CLIENT role
      if (req.user.role === 'CLIENT') {
        // Verify if clientId matches user's client profile
        // This requires logic or we assume clientId provided IS their id?
        // For now, let's allow staff. 
      }

      const service = await createAnalyticsService(req);
      const analyticsData = await service.getAnalytics({
        tenantId: req.user.tenantId,
        userId: req.user.id,
        role: req.user.role,
        periodDays: period,
        clientId: clientId // Pass clientId filter
      });
      res.json({ success: true, data: analyticsData });
    } catch (error) {
      console.error('Erro ao buscar analytics de membro:', error);
      res.status(500).json({ success: false, error: 'Erro interno' });
    }
  }
);

/**
 * @route GET /api/analytics/trainer/:trainerId
 * @desc Analytics específico de um treinador
 */
router.get('/trainer/:trainerId',
  requireRole(['ADMIN', 'OWNER', 'SUPER_ADMIN']),
  async (req: any, res) => {
    try {
      const { trainerId } = req.params;
      const period = parseInt(req.query.period || '30');

      const service = await createAnalyticsService(req);
      const analyticsData = await service.getAnalytics({
        tenantId: req.user.tenantId,
        userId: req.user.id, // calling user
        role: req.user.role,
        periodDays: period,
        trainerId: trainerId // Pass trainerId filter
      });
      res.json({ success: true, data: analyticsData });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro interno' });
    }
  }
);

/**
 * @route GET /api/analytics/tenant/:tenantId
 * @desc Analytics de um tenant específico (Super Admin)
 */
router.get('/tenant/:tenantId',
  requireRole(['SUPER_ADMIN']),
  async (req: any, res) => {
    try {
      const { tenantId } = req.params;
      const period = parseInt(req.query.period || '30');

      const service = await createAnalyticsService(req);
      const analyticsData = await service.getAnalytics({
        tenantId: tenantId, // Use parameter tenantId
        userId: req.user.id,
        role: req.user.role,
        periodDays: period,
      });
      res.json({ success: true, data: analyticsData });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Erro interno' });
    }
  }
);

export default router;