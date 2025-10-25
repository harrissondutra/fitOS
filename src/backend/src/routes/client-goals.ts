import { Router } from 'express';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
import { requireRole } from '../middleware/permissions';
import { param, body, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();
const authMiddleware = getAuthMiddleware(prisma);

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

    const whereClause: any = {
      tenantId: req.user.tenantId
    };

    // Filtrar por status se fornecido
    if (status) {
      whereClause.status = status;
    }

    // Filtrar por cliente se fornecido
    if (clientId) {
      whereClause.clientId = clientId;
    }

    // Se for TRAINER, filtrar apenas membros atribuídos a ele
    if (req.user.role === 'TRAINER') {
      const trainerClients = await prisma.clientTrainer.findMany({
        where: {
          trainerId: req.user.id
        },
        select: { clientId: true }
      });

      const clientIds = trainerClients.map(tm => tm.clientId);
      whereClause.clientId = { in: clientIds };
    }

    const goals = await prisma.clientGoal.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

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

      const { clientId, title, description, type, target, current, unit, startDate, targetDate } = req.body;

      // Verificar se membro existe e pertence ao tenant
      const client = await prisma.client.findFirst({
        where: {
          id: clientId,
          tenantId: req.user.tenantId
        }
      });

      if (!client) {
        return res.status(404).json({ success: false, error: 'Membro não encontrado' });
      }

      // Se for TRAINER, verificar se o membro está atribuído a ele
      if (req.user.role === 'TRAINER') {
        const trainerClient = await prisma.clientTrainer.findFirst({
          where: {
            clientId,
            trainerId: req.user.id
          }
        });

        if (!trainerClient) {
          return res.status(403).json({ 
            success: false, 
            error: 'Você não tem permissão para criar metas para este membro' 
          });
        }
      }

      // Verificar se data meta é posterior à data de início
      if (new Date(targetDate) <= new Date(startDate)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Data meta deve ser posterior à data de início' 
        });
      }

      const goal = await prisma.clientGoal.create({
        data: {
          clientId,
          tenantId: req.user.tenantId,
          title,
          description,
          type,
          target: parseFloat(target),
          current: parseFloat(current),
          unit,
          startDate: new Date(startDate),
          targetDate: new Date(targetDate),
          status: 'active'
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      res.status(201).json({ success: true, goal });
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

      const goal = await prisma.clientGoal.findFirst({
        where: {
          id,
          tenantId: req.user.tenantId
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!goal) {
        return res.status(404).json({ success: false, error: 'Meta não encontrada' });
      }

      // Se for TRAINER, verificar se o membro está atribuído a ele
      if (req.user.role === 'TRAINER') {
        const trainerClient = await prisma.clientTrainer.findFirst({
          where: {
            clientId: goal.clientId,
            trainerId: req.user.id
          }
        });

        if (!trainerClient) {
          return res.status(403).json({ 
            success: false, 
            error: 'Você não tem permissão para acessar esta meta' 
          });
        }
      }

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
      const existingGoal = await prisma.clientGoal.findFirst({
        where: {
          id,
          tenantId: req.user.tenantId
        }
      });

      if (!existingGoal) {
        return res.status(404).json({ success: false, error: 'Meta não encontrada' });
      }

      // Se for TRAINER, verificar se o membro está atribuído a ele
      if (req.user.role === 'TRAINER') {
        const trainerClient = await prisma.clientTrainer.findFirst({
          where: {
            clientId: existingGoal.clientId,
            trainerId: req.user.id,
          }
        });

        if (!trainerClient) {
          return res.status(403).json({ 
            success: false, 
            error: 'Você não tem permissão para atualizar esta meta' 
          });
        }
      }

      // Verificar se data meta é posterior à data de início
      if (updateData.startDate && updateData.targetDate) {
        if (new Date(updateData.targetDate) <= new Date(updateData.startDate)) {
          return res.status(400).json({ 
            success: false, 
            error: 'Data meta deve ser posterior à data de início' 
          });
        }
      }

      // Se current >= target e status é active, marcar como achieved
      const newCurrent = updateData.current !== undefined ? parseFloat(updateData.current) : existingGoal.current;
      const newTarget = updateData.target !== undefined ? parseFloat(updateData.target) : existingGoal.target;
      
      if (newCurrent >= newTarget && existingGoal.status === 'active') {
        updateData.status = 'achieved';
        updateData.achievedAt = new Date();
      }

      const goal = await prisma.clientGoal.update({
        where: { id },
        data: {
          ...updateData,
          target: updateData.target ? parseFloat(updateData.target) : undefined,
          current: updateData.current ? parseFloat(updateData.current) : undefined,
          startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
          targetDate: updateData.targetDate ? new Date(updateData.targetDate) : undefined
        },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      res.json({ success: true, goal });
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
      const existingGoal = await prisma.clientGoal.findFirst({
        where: {
          id,
          tenantId: req.user.tenantId
        }
      });

      if (!existingGoal) {
        return res.status(404).json({ success: false, error: 'Meta não encontrada' });
      }

      // Se for TRAINER, verificar se o membro está atribuído a ele
      if (req.user.role === 'TRAINER') {
        const trainerClient = await prisma.clientTrainer.findFirst({
          where: {
            clientId: existingGoal.clientId,
            trainerId: req.user.id,
          }
        });

        if (!trainerClient) {
          return res.status(403).json({ 
            success: false, 
            error: 'Você não tem permissão para atualizar esta meta' 
          });
        }
      }

      const newCurrent = parseFloat(current);
      const updateData: any = { current: newCurrent };

      // Se current >= target e status é active, marcar como achieved
      if (newCurrent >= existingGoal.target && existingGoal.status === 'active') {
        updateData.status = 'achieved';
        updateData.achievedAt = new Date();
      }

      const goal = await prisma.clientGoal.update({
        where: { id },
        data: updateData,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      res.json({ success: true, goal });
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
      const existingGoal = await prisma.clientGoal.findFirst({
        where: {
          id,
          tenantId: req.user.tenantId
        }
      });

      if (!existingGoal) {
        return res.status(404).json({ success: false, error: 'Meta não encontrada' });
      }

      // Se for TRAINER, verificar se o membro está atribuído a ele
      if (req.user.role === 'TRAINER') {
        const trainerClient = await prisma.clientTrainer.findFirst({
          where: {
            clientId: existingGoal.clientId,
            trainerId: req.user.id,
          }
        });

        if (!trainerClient) {
          return res.status(403).json({ 
            success: false, 
            error: 'Você não tem permissão para excluir esta meta' 
          });
        }
      }

      await prisma.clientGoal.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Meta excluída com sucesso' });
    } catch (error: any) {
      console.error('Erro ao excluir meta:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

export default router;
