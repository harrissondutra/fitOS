import { Router } from 'express';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
import { requireRole } from '../middleware/permissions';
import { query, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();
const authMiddleware = getAuthMiddleware(prisma);

// Middleware de autenticação para todas as rotas
router.use(authMiddleware.requireAuth);

/**
 * @route GET /api/audit-logs
 * @desc Buscar logs de auditoria
 * @access ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/', 
  requireRole(['ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    query('action').optional().isIn(['create', 'update', 'delete']),
    query('entityType').optional().isString(),
    query('entityId').optional().isString(),
    query('userId').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { action, entityType, entityId, userId, limit = 50, offset = 0 } = req.query;

      // Construir filtros
      const whereClause: any = {
        tenantId: req.user.tenantId
      };

      if (action) {
        whereClause.action = action;
      }

      if (entityType) {
        whereClause.entityType = entityType;
      }

      if (entityId) {
        whereClause.entityId = entityId;
      }

      if (userId) {
        whereClause.userId = userId;
      }

      // Se for ADMIN, não pode ver logs de SUPER_ADMIN
      if (req.user.role === 'ADMIN') {
        const superAdminUsers = await prisma.user.findMany({
          where: { role: 'SUPER_ADMIN' },
          select: { id: true }
        });
        
        const superAdminIds = superAdminUsers.map(u => u.id);
        whereClause.userId = { notIn: superAdminIds };
      }

      const logs = await prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      });

      const totalCount = await prisma.auditLog.count({
        where: whereClause
      });

      res.json({ 
        success: true, 
        logs,
        pagination: {
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: totalCount > parseInt(offset as string) + parseInt(limit as string)
        }
      });
    } catch (error: any) {
      console.error('Erro ao buscar logs de auditoria:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/audit-logs/:id
 * @desc Buscar log específico
 * @access ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/:id',
  requireRole(['ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [query('id').isString().notEmpty()],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;

      const log = await prisma.auditLog.findFirst({
        where: {
          id,
          tenantId: req.user.tenantId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!log) {
        return res.status(404).json({ success: false, error: 'Log não encontrado' });
      }

      res.json({ success: true, log });
    } catch (error: any) {
      console.error('Erro ao buscar log de auditoria:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

export default router;
