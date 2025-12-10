import { Router } from 'express';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { getPrismaClient } from '../config/database';
import { createClientGoalsService } from '../utils/service-factory';
import { requireRole } from '../middleware/permissions';
import { param, body, validationResult } from 'express-validator';

const router = Router();
const prisma = getPrismaClient();
const authMiddleware = getAuthMiddleware();

// Middleware de autenticação para todas as rotas
router.use(authMiddleware.requireAuth);

/**
 * @route GET /api/client-goals
 * @desc Listar metas dos clientes
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/', requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const { status, clientId } = req.query;
    const service = await createClientGoalsService(req);
    const goals = await service.listGoals({
      tenantId: req.user.tenantId,
      role: req.user.role,
      userId: req.user.id,
      status,
      clientId,
    } as any);

    res.json({ success: true, goals });
  } catch (error: any) {
    console.error('Erro ao buscar metas:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * @route POST /api/client-goals
 * @desc Criar meta para cliente
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.post('/',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    body('clientId').isString().notEmpty().withMessage('ID do membro é obrigatório'),
    body('title').notEmpty().withMessage('Título é obrigatório'),
    body('type').notEmpty().withMessage('Tipo é obrigatório'),
    body('target').isFloat({ min: 0 }).withMessage('Valor alvo deve ser positivo'),
    body('current').isFloat({ min: 0 }).withMessage('Valor atual deve ser positivo'),
    body('unit').notEmpty().withMessage('Unidade é obrigatória'),
    body('startDate').isISO8601().withMessage('Data de início inválida'),
    body('targetDate').isISO8601().withMessage('Data meta inválida'),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const service = await createClientGoalsService(req);
      const result = await service.createGoal({
        tenantId: req.user.tenantId,
        role: req.user.role,
        userId: req.user.id,
        data: req.body,
      });

      if ((result as any).notFound) return res.status(404).json({ success: false, error: 'Membro não encontrado' });
      if ((result as any).forbidden) return res.status(403).json({ success: false, error: 'Você não tem permissão para criar metas para este membro' });
      if ((result as any).invalidDates) return res.status(400).json({ success: false, error: 'Data meta deve ser posterior à data de início' });

      res.status(201).json({ success: true, goal: (result as any).goal });
    } catch (error: any) {
      console.error('Erro ao criar meta:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/client-goals/:id
 * @desc Buscar meta específica
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/:id',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [param('id').isString().notEmpty()],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;

      const service = await createClientGoalsService(req);
      const goal = await service.getGoalById(id, req.user.tenantId);

      if (!goal) {
        return res.status(404).json({ success: false, error: 'Meta não encontrada' });
      }

      // Se for TRAINER, verificar se o membro está atribuído a ele
      const canAccess = await service.canAccessClient(goal.clientId, req.user.role, req.user.id);
      if (!canAccess) return res.status(403).json({ success: false, error: 'Você não tem permissão para acessar esta meta' });

      res.json({ success: true, goal });
    } catch (error: any) {
      console.error('Erro ao buscar meta:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route PUT /api/client-goals/:id
 * @desc Atualizar meta
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.put('/:id',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    param('id').isString().notEmpty(),
    body('target').optional().isFloat({ min: 0 }),
    body('current').optional().isFloat({ min: 0 }),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Verificar se meta existe e pertence ao tenant
      const service = await createClientGoalsService(req);
      const result = await service.updateGoal(id, req.user.tenantId, req.user.role, req.user.id, updateData);
      if ((result as any).notFound) return res.status(404).json({ success: false, error: 'Meta não encontrada' });
      if ((result as any).forbidden) return res.status(403).json({ success: false, error: 'Você não tem permissão para atualizar esta meta' });
      if ((result as any).invalidDates) return res.status(400).json({ success: false, error: 'Data meta deve ser posterior à data de início' });
      res.json({ success: true, goal: (result as any).goal });
    } catch (error: any) {
      console.error('Erro ao atualizar meta:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route PUT /api/client-goals/:id/progress
 * @desc Atualizar progresso da meta
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.put('/:id/progress',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    param('id').isString().notEmpty(),
    body('current').isFloat({ min: 0 }).withMessage('Valor atual deve ser positivo'),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const { current } = req.body;

      // Verificar se meta existe e pertence ao tenant
      const service = await createClientGoalsService(req);
      const result = await service.updateProgress(id, req.user.tenantId, req.user.role, req.user.id, current);
      if ((result as any).notFound) return res.status(404).json({ success: false, error: 'Meta não encontrada' });
      if ((result as any).forbidden) return res.status(403).json({ success: false, error: 'Você não tem permissão para atualizar esta meta' });
      res.json({ success: true, goal: (result as any).goal });
    } catch (error: any) {
      console.error('Erro ao atualizar progresso:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route DELETE /api/client-goals/:id
 * @desc Excluir meta
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.delete('/:id',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [param('id').isString().notEmpty()],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;

      // Verificar se meta existe e pertence ao tenant
      const service = await createClientGoalsService(req);
      const result = await service.deleteGoal(id, req.user.tenantId, req.user.role, req.user.id);
      if ((result as any).notFound) return res.status(404).json({ success: false, error: 'Meta não encontrada' });
      if ((result as any).forbidden) return res.status(403).json({ success: false, error: 'Você não tem permissão para excluir esta meta' });
      res.json({ success: true, message: 'Meta excluída com sucesso' });
    } catch (error: any) {
      console.error('Erro ao excluir meta:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

export default router;
