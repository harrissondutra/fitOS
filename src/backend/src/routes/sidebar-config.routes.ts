/**
 * Sidebar Config Routes
 * 
 * Endpoints para gerenciar configurações de sidebar:
 * - GET /api/sidebar/config - Obter sidebar do tenant atual
 * - GET /api/sidebar/preview - Preview de config (SUPER_ADMIN)
 * - GET /api/sidebar/plan/:plan/current - Obter config atual (SUPER_ADMIN)
 * - GET /api/sidebar/plan/:plan/history - Histórico de versões (SUPER_ADMIN)
 * - POST /api/sidebar/plan/:plan - Salvar config (SUPER_ADMIN)
 * - PUT /api/sidebar/tenant - Salvar customização do tenant (OWNER)
 */

import { Router } from 'express';
import { SidebarConfigService } from '../services/sidebar-config.service';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/permissions';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/sidebar/config - Obter sidebar do tenant atual
router.get('/config',
  (req, res, next) => {
    const prisma = getPrismaClient();
    const authMiddleware = getAuthMiddleware();
    authMiddleware.authenticateToken(req, res, next);
  },
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const sidebarService = new SidebarConfigService(prisma);
      const role = req.user?.role as string | undefined;
      const tenantId = req.tenantId as string | undefined;

      // SUPER_ADMIN: permitir sem tenant (retornar configuração administrativa padrão)
      if (role === 'SUPER_ADMIN' && !tenantId) {
        const adminDefault = await sidebarService.getPlanConfig('super_admin');
        return res.json({ success: true, data: adminDefault });
      }

      if (!tenantId) {
        return res.status(400).json({ success: false, error: { message: 'Tenant ID não encontrado' } });
      }

      const menus = await sidebarService.getSidebarForTenant(tenantId, role || 'CLIENT');
      res.json({ success: true, data: menus });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/sidebar/preview - Preview de config (SUPER_ADMIN)
router.get('/preview',
  (req, res, next) => {
    const prisma = getPrismaClient();
    const authMiddleware = getAuthMiddleware();
    authMiddleware.authenticateToken(req, res, next);
  },
  requireRole(['SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const sidebarService = new SidebarConfigService(prisma);
      const { plan, role } = req.query;
      const menus = await sidebarService.previewConfig(plan as string, role as string);
      res.json({ success: true, data: menus });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/sidebar/plan/:plan/current - Obter config atual de um plano (SUPER_ADMIN)
router.get('/plan/:plan/current',
  (req, res, next) => {
    const prisma = getPrismaClient();
    const authMiddleware = getAuthMiddleware();
    authMiddleware.authenticateToken(req, res, next);
  },
  requireRole(['SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const sidebarService = new SidebarConfigService(prisma);
      logger.info('Fetching plan config', { plan: req.params.plan });
      const config = await sidebarService.getPlanConfig(req.params.plan);
      logger.info('Plan config retrieved', { plan: req.params.plan, menuCount: config.length });
      res.json({ success: true, data: config });
    } catch (error) {
      logger.error('Error fetching plan config:', error);
      next(error);
    }
  }
);

// GET /api/sidebar/plan/:plan/history - Histórico de versões (SUPER_ADMIN)
router.get('/plan/:plan/history',
  (req, res, next) => {
    const prisma = getPrismaClient();
    const authMiddleware = getAuthMiddleware();
    authMiddleware.authenticateToken(req, res, next);
  },
  requireRole(['SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const sidebarService = new SidebarConfigService(prisma);
      const history = await sidebarService.getVersionHistory(req.params.plan);
      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/sidebar/plan/:plan - Salvar config padrão de um plano (SUPER_ADMIN)
router.post('/plan/:plan',
  (req, res, next) => {
    const prisma = getPrismaClient();
    const authMiddleware = getAuthMiddleware();
    authMiddleware.authenticateToken(req, res, next);
  },
  requireRole(['SUPER_ADMIN']),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const sidebarService = new SidebarConfigService(prisma);
      await sidebarService.savePlanDefaultConfig(
        req.params.plan,
        req.body.menuItems,
        req.user?.id!,
        req.body.changelog
      );
      res.json({ success: true, message: 'Plan config saved successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/sidebar/tenant - Salvar customização do tenant (OWNER)
router.put('/tenant',
  (req, res, next) => {
    const prisma = getPrismaClient();
    const authMiddleware = getAuthMiddleware();
    authMiddleware.authenticateToken(req, res, next);
  },
  requireRole(['SUPER_ADMIN', 'OWNER']),
  async (req, res, next) => {
    try {
      const prisma = getPrismaClient();
      const sidebarService = new SidebarConfigService(prisma);
      await sidebarService.saveTenantCustomization(
        req.tenantId!,
        req.user?.id!,
        req.body
      );
      res.json({ success: true, message: 'Customization saved successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
