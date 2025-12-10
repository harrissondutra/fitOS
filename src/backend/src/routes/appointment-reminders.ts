import { Router } from 'express';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { getPrismaClient } from '../config/database';
import { requireRole } from '../middleware/permissions';
import { param, body, validationResult } from 'express-validator';

const router = Router();
const prisma = getPrismaClient();
const authMiddleware = getAuthMiddleware();

// Middleware de autenticação para todas as rotas
router.use(authMiddleware.authenticateToken);

/**
 * @route GET /api/appointment-reminders
 * @desc Listar lembretes de agendamentos
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/', requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const { status, appointmentId } = req.query;

    const whereClause: any = {
      appointment: {
        tenantId: req.user.tenantId
      }
    };

    if (status) {
      whereClause.status = status;
    }

    if (appointmentId) {
      whereClause.appointmentId = appointmentId;
    }

    // Se for TRAINER, filtrar apenas agendamentos seus
    if (req.user.role === 'TRAINER') {
      whereClause.appointment.professionalId = req.user.id;
    }

    const reminders = await prisma.appointmentReminder.findMany({
      where: whereClause,
      include: {
        appointment: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: { scheduledFor: 'desc' }
    });

    res.json({ success: true, reminders });
  } catch (error: any) {
    console.error('Erro ao buscar lembretes:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * @route POST /api/appointment-reminders
 * @desc Criar lembrete de agendamento
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.post('/',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    body('appointmentId').isString().notEmpty().withMessage('ID do agendamento é obrigatório'),
    body('type').isIn(['24h_before', '1h_before', '30min_before', 'custom']).withMessage('Tipo inválido'),
    body('customHours').optional().isInt({ min: 0, max: 168 }),
    body('customMinutes').optional().isInt({ min: 0, max: 59 }),
    body('message').optional().isString(),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { appointmentId, type, customHours, customMinutes, message, enabled } = req.body;

      // Verificar se agendamento existe e pertence ao tenant
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          tenantId: req.user.tenantId
        }
      });

      if (!appointment) {
        return res.status(404).json({ success: false, error: 'Agendamento não encontrado' });
      }

      // Se for TRAINER, verificar se o agendamento é dele
      if (req.user.role === 'TRAINER' && appointment.professionalId !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          error: 'Você não tem permissão para criar lembretes para este agendamento' 
        });
      }

      // Calcular data do lembrete
      const scheduledFor = new Date(appointment.scheduledAt);
      
      if (type === '24h_before') {
        scheduledFor.setHours(scheduledFor.getHours() - 24);
      } else if (type === '1h_before') {
        scheduledFor.setHours(scheduledFor.getHours() - 1);
      } else if (type === '30min_before') {
        scheduledFor.setMinutes(scheduledFor.getMinutes() - 30);
      } else if (type === 'custom') {
        const hours = customHours || 0;
        const minutes = customMinutes || 0;
        scheduledFor.setHours(scheduledFor.getHours() - hours);
        scheduledFor.setMinutes(scheduledFor.getMinutes() - minutes);
      }

      // Verificar se já existe lembrete para este agendamento e tipo
      const existingReminder = await prisma.appointmentReminder.findFirst({
        where: {
          appointmentId,
          type
        }
      });

      if (existingReminder) {
        return res.status(409).json({ 
          success: false, 
          error: 'Já existe um lembrete deste tipo para este agendamento' 
        });
      }

      const reminder = await prisma.appointmentReminder.create({
        data: {
          appointmentId,
          type,
          scheduledFor,
          status: 'pending'
        },
        include: {
          appointment: {
            select: {
              id: true,
              title: true,
              scheduledAt: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        }
      });

      res.status(201).json({ success: true, reminder });
    } catch (error: any) {
      console.error('Erro ao criar lembrete:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/appointment-reminders/:id
 * @desc Buscar lembrete específico
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

      const reminder = await prisma.appointmentReminder.findFirst({
        where: {
          id,
          appointment: {
            tenantId: req.user.tenantId,
            professionalId: req.user.role === 'TRAINER' ? req.user.id : undefined
          }
        },
        include: {
          appointment: {
            select: {
              id: true,
              title: true,
              scheduledAt: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        }
      });

      if (!reminder) {
        return res.status(404).json({ success: false, error: 'Lembrete não encontrado' });
      }

      res.json({ success: true, reminder });
    } catch (error: any) {
      console.error('Erro ao buscar lembrete:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route PUT /api/appointment-reminders/:id
 * @desc Atualizar lembrete
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.put('/:id',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    param('id').isString().notEmpty(),
    body('type').optional().isIn(['24h_before', '1h_before', '30min_before', 'custom']),
    body('message').optional().isString(),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Verificar se lembrete existe e pertence ao tenant
      const existingReminder = await prisma.appointmentReminder.findFirst({
        where: {
          id,
          appointment: {
            tenantId: req.user.tenantId,
            professionalId: req.user.role === 'TRAINER' ? req.user.id : undefined
          }
        }
      });

      if (!existingReminder) {
        return res.status(404).json({ success: false, error: 'Lembrete não encontrado' });
      }

      const reminder = await prisma.appointmentReminder.update({
        where: { id },
        data: updateData,
        include: {
          appointment: {
            select: {
              id: true,
              title: true,
              scheduledAt: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        }
      });

      res.json({ success: true, reminder });
    } catch (error: any) {
      console.error('Erro ao atualizar lembrete:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route POST /api/appointment-reminders/:id/resend
 * @desc Reenviar lembrete
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.post('/:id/resend',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [param('id').isString().notEmpty()],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;

      // Verificar se lembrete existe e pertence ao tenant
      const existingReminder = await prisma.appointmentReminder.findFirst({
        where: {
          id,
          appointment: {
            tenantId: req.user.tenantId,
            professionalId: req.user.role === 'TRAINER' ? req.user.id : undefined
          }
        }
      });

      if (!existingReminder) {
        return res.status(404).json({ success: false, error: 'Lembrete não encontrado' });
      }

      // Simular reenvio (em produção, aqui seria enviado o email/SMS)
      const reminder = await prisma.appointmentReminder.update({
        where: { id },
        data: {
          status: 'sent',
          sentAt: new Date()
        },
        include: {
          appointment: {
            select: {
              id: true,
              title: true,
              scheduledAt: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        }
      });

      res.json({ success: true, reminder });
    } catch (error: any) {
      console.error('Erro ao reenviar lembrete:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route DELETE /api/appointment-reminders/:id
 * @desc Excluir lembrete
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

      // Verificar se lembrete existe e pertence ao tenant
      const existingReminder = await prisma.appointmentReminder.findFirst({
        where: {
          id,
          appointment: {
            tenantId: req.user.tenantId,
            professionalId: req.user.role === 'TRAINER' ? req.user.id : undefined
          }
        }
      });

      if (!existingReminder) {
        return res.status(404).json({ success: false, error: 'Lembrete não encontrado' });
      }

      await prisma.appointmentReminder.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Lembrete excluído com sucesso' });
    } catch (error: any) {
      console.error('Erro ao excluir lembrete:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

export default router;
