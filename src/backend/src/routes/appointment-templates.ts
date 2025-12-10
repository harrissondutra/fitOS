import { Router } from 'express';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { getPrismaClient } from '../config/database';
import { requireRole } from '../middleware/permissions';
import { param, body, validationResult } from 'express-validator';

const router = Router();
const prisma = getPrismaClient();
const authMiddleware = getAuthMiddleware();

// Middleware de autenticação para todas as rotas
router.use(authMiddleware.requireAuth);

/**
 * @route GET /api/appointment-templates
 * @desc Listar templates de agendamento
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/', requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const templates = await prisma.appointmentTemplate.findMany({
      where: {
        tenantId: req.user.tenantId,
        professionalId: req.user.role === 'TRAINER' ? req.user.id : undefined
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, templates });
  } catch (error: any) {
    console.error('Erro ao buscar templates:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * @route POST /api/appointment-templates
 * @desc Criar template de agendamento
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.post('/', 
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    body('name').notEmpty().withMessage('Nome é obrigatório'),
    body('type').notEmpty().withMessage('Tipo é obrigatório'),
    body('duration').isInt({ min: 15, max: 480 }).withMessage('Duração deve ser entre 15 e 480 minutos'),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, type, duration, description, location, isVirtual, isActive } = req.body;

      const template = await prisma.appointmentTemplate.create({
        data: {
          tenantId: req.user.tenantId,
          professionalId: req.user.id,
          name,
          type,
          duration: parseInt(duration),
          description,
          location,
          isVirtual: Boolean(isVirtual),
          isActive: Boolean(isActive)
        }
      });

      res.status(201).json({ success: true, template });
    } catch (error: any) {
      console.error('Erro ao criar template:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/appointment-templates/:id
 * @desc Buscar template específico
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

      const template = await prisma.appointmentTemplate.findFirst({
        where: {
          id,
          tenantId: req.user.tenantId,
          professionalId: req.user.role === 'TRAINER' ? req.user.id : undefined
        }
      });

      if (!template) {
        return res.status(404).json({ success: false, error: 'Template não encontrado' });
      }

      res.json({ success: true, template });
    } catch (error: any) {
      console.error('Erro ao buscar template:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route PUT /api/appointment-templates/:id
 * @desc Atualizar template
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.put('/:id',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    param('id').isString().notEmpty(),
    body('name').optional().notEmpty(),
    body('duration').optional().isInt({ min: 15, max: 480 }),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Verificar se template existe e pertence ao usuário/tenant
      const existingTemplate = await prisma.appointmentTemplate.findFirst({
        where: {
          id,
          tenantId: req.user.tenantId,
          professionalId: req.user.role === 'TRAINER' ? req.user.id : undefined
        }
      });

      if (!existingTemplate) {
        return res.status(404).json({ success: false, error: 'Template não encontrado' });
      }

      const template = await prisma.appointmentTemplate.update({
        where: { id },
        data: {
          ...updateData,
          duration: updateData.duration ? parseInt(updateData.duration) : undefined,
          isVirtual: updateData.isVirtual !== undefined ? Boolean(updateData.isVirtual) : undefined,
          isActive: updateData.isActive !== undefined ? Boolean(updateData.isActive) : undefined
        }
      });

      res.json({ success: true, template });
    } catch (error: any) {
      console.error('Erro ao atualizar template:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route DELETE /api/appointment-templates/:id
 * @desc Excluir template
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

      // Verificar se template existe e pertence ao usuário/tenant
      const existingTemplate = await prisma.appointmentTemplate.findFirst({
        where: {
          id,
          tenantId: req.user.tenantId,
          professionalId: req.user.role === 'TRAINER' ? req.user.id : undefined
        }
      });

      if (!existingTemplate) {
        return res.status(404).json({ success: false, error: 'Template não encontrado' });
      }

      await prisma.appointmentTemplate.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Template excluído com sucesso' });
    } catch (error: any) {
      console.error('Erro ao excluir template:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

export default router;
