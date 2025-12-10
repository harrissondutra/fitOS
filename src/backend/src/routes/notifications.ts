import { Router } from 'express';
import { NotificationService } from '../services/notification.service';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { getPrismaClient } from '../config/database';
import { body, param, query, validationResult } from 'express-validator';
// import { getTenantPrisma } from '../utils/prisma'; // caminho removido/obsoleto
import { getTenantPrismaWrapper } from '../utils/prisma-tenant-helper';

const router = Router();
const notificationService = new NotificationService();
const prisma = getPrismaClient();
const authMiddleware = getAuthMiddleware();

// Middleware de autenticação para todas as rotas
router.use(authMiddleware.requireAuth);

/**
 * @route GET /api/notifications
 * @desc Listar notificações do usuário
 * @access ALL
 */
router.get(
  '/',
  [
    query('type').optional().isString(),
    query('read').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const filters = {
        userId: req.user.id,
        tenantId: req.user.tenantId,
        ...req.query
      };

      // Passar tenantId para permitir consultas isoladas quando for persistido
      const result = await notificationService.getNotifications(filters);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        notifications: result.notifications,
        total: result.total,
        unreadCount: result.unreadCount,
        limit: filters.limit || 20,
        offset: filters.offset || 0
      });
    } catch (error: any) {
      console.error('Erro ao listar notificações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route PUT /api/notifications/:id/read
 * @desc Marcar notificação como lida
 * @access ALL
 */
router.put(
  '/:id/read',
  [param('id').isString().notEmpty()],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await notificationService.markAsRead(
        req.params.id,
        req.user.id
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: 'Notificação marcada como lida' });
    } catch (error: any) {
      console.error('Erro ao marcar notificação como lida:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route PUT /api/notifications/read-all
 * @desc Marcar todas as notificações como lidas
 * @access ALL
 */
router.put(
  '/read-all',
  [],
  async (req: any, res) => {
    try {
      const result = await notificationService.markAllAsRead(
        req.user.id
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: 'Todas as notificações foram marcadas como lidas' });
    } catch (error: any) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route DELETE /api/notifications/:id
 * @desc Deletar notificação
 * @access ALL
 */
router.delete(
  '/:id',
  [param('id').isString().notEmpty()],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await notificationService.deleteNotification(
        req.params.id,
        req.user.id
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: 'Notificação deletada com sucesso' });
    } catch (error: any) {
      console.error('Erro ao deletar notificação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/notifications/stats
 * @desc Obter estatísticas de notificações
 * @access ALL
 */
router.get(
  '/stats',
  [],
  async (req: any, res) => {
    try {
      const result = await notificationService.getNotificationStats(
        req.user.id
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ stats: result.data });
    } catch (error: any) {
      console.error('Erro ao obter estatísticas de notificações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default router;
