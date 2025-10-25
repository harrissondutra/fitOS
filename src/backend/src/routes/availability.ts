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

// ============================================================================
// AVAILABILITY SLOTS (Horários Semanais)
// ============================================================================

/**
 * @route GET /api/availability/slots
 * @desc Listar horários de disponibilidade
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/slots', requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const slots = await prisma.professionalAvailability.findMany({
      where: {
        tenantId: req.user.tenantId,
        professionalId: req.user.role === 'TRAINER' ? req.user.id : undefined
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });

    res.json({ success: true, slots });
  } catch (error: any) {
    console.error('Erro ao buscar horários:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * @route POST /api/availability/slots
 * @desc Criar horário de disponibilidade
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.post('/slots',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    body('dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('Dia da semana deve ser entre 0 e 6'),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Horário de início inválido'),
    body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Horário de fim inválido'),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { dayOfWeek, startTime, endTime, isActive } = req.body;

      // Verificar se já existe horário para o mesmo dia
      const existingSlot = await prisma.professionalAvailability.findFirst({
        where: {
          tenantId: req.user.tenantId,
          professionalId: req.user.id,
          dayOfWeek: parseInt(dayOfWeek)
        }
      });

      if (existingSlot) {
        return res.status(409).json({ 
          success: false, 
          error: 'Já existe um horário configurado para este dia da semana' 
        });
      }

      const slot = await prisma.professionalAvailability.create({
        data: {
          tenantId: req.user.tenantId,
          professionalId: req.user.id,
          dayOfWeek: parseInt(dayOfWeek),
          startTime,
          endTime,
          isActive: Boolean(isActive)
        }
      });

      res.status(201).json({ success: true, slot });
    } catch (error: any) {
      console.error('Erro ao criar horário:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route PUT /api/availability/slots/:id
 * @desc Atualizar horário de disponibilidade
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.put('/slots/:id',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    param('id').isString().notEmpty(),
    body('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Verificar se slot existe e pertence ao usuário/tenant
      const existingSlot = await prisma.professionalAvailability.findFirst({
        where: {
          id,
          tenantId: req.user.tenantId,
          professionalId: req.user.role === 'TRAINER' ? req.user.id : undefined
        }
      });

      if (!existingSlot) {
        return res.status(404).json({ success: false, error: 'Horário não encontrado' });
      }

      const slot = await prisma.professionalAvailability.update({
        where: { id },
        data: {
          ...updateData,
          dayOfWeek: updateData.dayOfWeek ? parseInt(updateData.dayOfWeek) : undefined,
          isActive: updateData.isActive !== undefined ? Boolean(updateData.isActive) : undefined
        }
      });

      res.json({ success: true, slot });
    } catch (error: any) {
      console.error('Erro ao atualizar horário:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route DELETE /api/availability/slots/:id
 * @desc Excluir horário de disponibilidade
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.delete('/slots/:id',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [param('id').isString().notEmpty()],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;

      // Verificar se slot existe e pertence ao usuário/tenant
      const existingSlot = await prisma.professionalAvailability.findFirst({
        where: {
          id,
          tenantId: req.user.tenantId,
          professionalId: req.user.role === 'TRAINER' ? req.user.id : undefined
        }
      });

      if (!existingSlot) {
        return res.status(404).json({ success: false, error: 'Horário não encontrado' });
      }

      await prisma.professionalAvailability.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Horário excluído com sucesso' });
    } catch (error: any) {
      console.error('Erro ao excluir horário:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

// ============================================================================
// AVAILABILITY BLOCKS (Bloqueios de Disponibilidade)
// ============================================================================

/**
 * @route GET /api/availability/blocks
 * @desc Listar bloqueios de disponibilidade
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/blocks', requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const blocks = await prisma.availabilityBlock.findMany({
      where: {
        tenantId: req.user.tenantId,
        professionalId: req.user.role === 'TRAINER' ? req.user.id : undefined
      },
      orderBy: { startDate: 'desc' }
    });

    res.json({ success: true, blocks });
  } catch (error: any) {
    console.error('Erro ao buscar bloqueios:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * @route POST /api/availability/blocks
 * @desc Criar bloqueio de disponibilidade
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.post('/blocks',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    body('startDate').isISO8601().withMessage('Data de início inválida'),
    body('endDate').isISO8601().withMessage('Data de fim inválida'),
    body('reason').optional().isString(),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { startDate, endDate, reason } = req.body;

      // Verificar se data de fim é posterior à data de início
      if (new Date(endDate) <= new Date(startDate)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Data de fim deve ser posterior à data de início' 
        });
      }

      const block = await prisma.availabilityBlock.create({
        data: {
          tenantId: req.user.tenantId,
          professionalId: req.user.id,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          reason
        }
      });

      res.status(201).json({ success: true, block });
    } catch (error: any) {
      console.error('Erro ao criar bloqueio:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route PUT /api/availability/blocks/:id
 * @desc Atualizar bloqueio de disponibilidade
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.put('/blocks/:id',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    param('id').isString().notEmpty(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Verificar se bloqueio existe e pertence ao usuário/tenant
      const existingBlock = await prisma.availabilityBlock.findFirst({
        where: {
          id,
          tenantId: req.user.tenantId,
          professionalId: req.user.role === 'TRAINER' ? req.user.id : undefined
        }
      });

      if (!existingBlock) {
        return res.status(404).json({ success: false, error: 'Bloqueio não encontrado' });
      }

      // Verificar se data de fim é posterior à data de início
      if (updateData.startDate && updateData.endDate) {
        if (new Date(updateData.endDate) <= new Date(updateData.startDate)) {
          return res.status(400).json({ 
            success: false, 
            error: 'Data de fim deve ser posterior à data de início' 
          });
        }
      }

      const block = await prisma.availabilityBlock.update({
        where: { id },
        data: {
          ...updateData,
          startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
          endDate: updateData.endDate ? new Date(updateData.endDate) : undefined
        }
      });

      res.json({ success: true, block });
    } catch (error: any) {
      console.error('Erro ao atualizar bloqueio:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route DELETE /api/availability/blocks/:id
 * @desc Excluir bloqueio de disponibilidade
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.delete('/blocks/:id',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [param('id').isString().notEmpty()],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;

      // Verificar se bloqueio existe e pertence ao usuário/tenant
      const existingBlock = await prisma.availabilityBlock.findFirst({
        where: {
          id,
          tenantId: req.user.tenantId,
          professionalId: req.user.role === 'TRAINER' ? req.user.id : undefined
        }
      });

      if (!existingBlock) {
        return res.status(404).json({ success: false, error: 'Bloqueio não encontrado' });
      }

      await prisma.availabilityBlock.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Bloqueio excluído com sucesso' });
    } catch (error: any) {
      console.error('Erro ao excluir bloqueio:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

export default router;
