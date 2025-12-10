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
 * @route GET /api/attendance
 * @desc Listar presenças
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/', requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const { status, clientId, appointmentId } = req.query;

    const whereClause: any = {
      tenantId: req.user.tenantId
    };

    if (status) {
      whereClause.status = status;
    }

    if (clientId) {
      whereClause.clientId = clientId;
    }

    if (appointmentId) {
      whereClause.appointmentId = appointmentId;
    }

    // Se for TRAINER, filtrar apenas agendamentos seus
    if (req.user.role === 'TRAINER') {
      whereClause.appointment = {
        professionalId: req.user.id
      };
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        appointment: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            location: true,
            client: {
              select: {
                id: true,
                name: true,
                phone: true
              }
            }
          }
        },
        client: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, attendances });
  } catch (error: any) {
    console.error('Erro ao buscar presenças:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * @route POST /api/attendance
 * @desc Criar registro de presença
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.post('/',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    body('appointmentId').isString().notEmpty().withMessage('ID do agendamento é obrigatório'),
    body('clientId').isString().notEmpty().withMessage('ID do membro é obrigatório'),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { appointmentId, clientId } = req.body;

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
          error: 'Você não tem permissão para gerenciar presença neste agendamento' 
        });
      }

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

      // Verificar se já existe registro de presença para este agendamento
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          appointmentId,
          clientId
        }
      });

      if (existingAttendance) {
        return res.status(409).json({ 
          success: false, 
          error: 'Já existe um registro de presença para este agendamento' 
        });
      }

      const attendance = await prisma.attendance.create({
        data: {
          appointmentId,
          clientId,
          tenantId: req.user.tenantId,
          status: 'scheduled'
        },
        include: {
          appointment: {
            select: {
              id: true,
              title: true,
              scheduledAt: true,
              location: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              }
            }
          },
          client: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.status(201).json({ success: true, attendance });
    } catch (error: any) {
      console.error('Erro ao criar presença:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route PUT /api/attendance/:id/check-in
 * @desc Fazer check-in
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.put('/:id/check-in',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [param('id').isString().notEmpty()],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;

      // Verificar se presença existe e pertence ao tenant
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          id,
          tenantId: req.user.tenantId,
          appointment: req.user.role === 'TRAINER' ? {
            professionalId: req.user.id
          } : undefined
        }
      });

      if (!existingAttendance) {
        return res.status(404).json({ success: false, error: 'Presença não encontrada' });
      }

      if (existingAttendance.status !== 'scheduled') {
        return res.status(400).json({ 
          success: false, 
          error: 'Apenas agendamentos marcados podem fazer check-in' 
        });
      }

      const attendance = await prisma.attendance.update({
        where: { id },
        data: {
          checkInAt: new Date(),
          status: 'checked_in'
        },
        include: {
          appointment: {
            select: {
              id: true,
              title: true,
              scheduledAt: true,
              location: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              }
            }
          },
          client: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.json({ success: true, attendance });
    } catch (error: any) {
      console.error('Erro ao fazer check-in:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route PUT /api/attendance/:id/check-out
 * @desc Fazer check-out
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.put('/:id/check-out',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [param('id').isString().notEmpty()],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;

      // Verificar se presença existe e pertence ao tenant
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          id,
          tenantId: req.user.tenantId,
          appointment: req.user.role === 'TRAINER' ? {
            professionalId: req.user.id
          } : undefined
        }
      });

      if (!existingAttendance) {
        return res.status(404).json({ success: false, error: 'Presença não encontrada' });
      }

      if (existingAttendance.status !== 'checked_in') {
        return res.status(400).json({ 
          success: false, 
          error: 'Apenas presenças com check-in podem fazer check-out' 
        });
      }

      const attendance = await prisma.attendance.update({
        where: { id },
        data: {
          checkOutAt: new Date(),
          status: 'completed'
        },
        include: {
          appointment: {
            select: {
              id: true,
              title: true,
              scheduledAt: true,
              location: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              }
            }
          },
          client: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.json({ success: true, attendance });
    } catch (error: any) {
      console.error('Erro ao fazer check-out:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route PUT /api/attendance/:id
 * @desc Atualizar status da presença
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.put('/:id',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    param('id').isString().notEmpty(),
    body('status').isIn(['scheduled', 'checked_in', 'completed', 'no_show']).withMessage('Status inválido'),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const { status } = req.body;

      // Verificar se presença existe e pertence ao tenant
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          id,
          tenantId: req.user.tenantId,
          appointment: req.user.role === 'TRAINER' ? {
            professionalId: req.user.id
          } : undefined
        }
      });

      if (!existingAttendance) {
        return res.status(404).json({ success: false, error: 'Presença não encontrada' });
      }

      const updateData: any = { status };

      // Se mudando para checked_in, adicionar checkInAt
      if (status === 'checked_in' && !existingAttendance.checkInAt) {
        updateData.checkInAt = new Date();
      }

      // Se mudando para completed, adicionar checkOutAt
      if (status === 'completed' && !existingAttendance.checkOutAt) {
        updateData.checkOutAt = new Date();
      }

      const attendance = await prisma.attendance.update({
        where: { id },
        data: updateData,
        include: {
          appointment: {
            select: {
              id: true,
              title: true,
              scheduledAt: true,
              location: true,
              client: {
                select: {
                  id: true,
                  name: true,
                  phone: true
                }
              }
            }
          },
          client: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.json({ success: true, attendance });
    } catch (error: any) {
      console.error('Erro ao atualizar presença:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route DELETE /api/attendance/:id
 * @desc Excluir presença
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

      // Verificar se presença existe e pertence ao tenant
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          id,
          tenantId: req.user.tenantId,
          appointment: req.user.role === 'TRAINER' ? {
            professionalId: req.user.id
          } : undefined
        }
      });

      if (!existingAttendance) {
        return res.status(404).json({ success: false, error: 'Presença não encontrada' });
      }

      await prisma.attendance.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Presença excluída com sucesso' });
    } catch (error: any) {
      console.error('Erro ao excluir presença:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

export default router;
