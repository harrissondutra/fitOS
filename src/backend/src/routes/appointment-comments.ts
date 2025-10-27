import { Router } from 'express';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
import { requireRole } from '../middleware/permissions';
import { param, body, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();
const authMiddleware = getAuthMiddleware(prisma);

// Middleware de autenticação para todas as rotas
router.use(authMiddleware.authenticateToken);

/**
 * @route GET /api/appointment-comments
 * @desc Listar comentários de agendamentos
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/', requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const { appointmentId } = req.query;

    const whereClause: any = {
      tenantId: req.user.tenantId
    };

    if (appointmentId) {
      whereClause.appointmentId = appointmentId;
    }

    // Se for TRAINER, filtrar apenas agendamentos seus
    if (req.user.role === 'TRAINER') {
      whereClause.appointment = {
        professionalId: req.user.id
      };
    }

    const comments = await prisma.appointmentComment.findMany({
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
                name: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, comments });
  } catch (error: any) {
    console.error('Erro ao buscar comentários:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * @route POST /api/appointment-comments
 * @desc Criar comentário em agendamento
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.post('/',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    body('appointmentId').isString().notEmpty().withMessage('ID do agendamento é obrigatório'),
    body('content').notEmpty().withMessage('Conteúdo é obrigatório'),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { appointmentId, content } = req.body;

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
          error: 'Você não tem permissão para comentar neste agendamento' 
        });
      }

      const comment = await prisma.appointmentComment.create({
        data: {
          appointmentId,
          userId: req.user.id,
          tenantId: req.user.tenantId,
          content
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
                  name: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      });

      res.status(201).json({ success: true, comment });
    } catch (error: any) {
      console.error('Erro ao criar comentário:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route PUT /api/appointment-comments/:id
 * @desc Atualizar comentário
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.put('/:id',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    param('id').isString().notEmpty(),
    body('content').notEmpty().withMessage('Conteúdo é obrigatório'),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const { content } = req.body;

      // Verificar se comentário existe e pertence ao usuário/tenant
      const existingComment = await prisma.appointmentComment.findFirst({
        where: {
          id,
          tenantId: req.user.tenantId,
          userId: req.user.role === 'TRAINER' ? req.user.id : undefined
        }
      });

      if (!existingComment) {
        return res.status(404).json({ success: false, error: 'Comentário não encontrado' });
      }

      const comment = await prisma.appointmentComment.update({
        where: { id },
        data: { content },
        include: {
          appointment: {
            select: {
              id: true,
              title: true,
              scheduledAt: true,
              client: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      });

      res.json({ success: true, comment });
    } catch (error: any) {
      console.error('Erro ao atualizar comentário:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route DELETE /api/appointment-comments/:id
 * @desc Excluir comentário
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

      // Verificar se comentário existe e pertence ao usuário/tenant
      const existingComment = await prisma.appointmentComment.findFirst({
        where: {
          id,
          tenantId: req.user.tenantId,
          userId: req.user.role === 'TRAINER' ? req.user.id : undefined
        }
      });

      if (!existingComment) {
        return res.status(404).json({ success: false, error: 'Comentário não encontrado' });
      }

      await prisma.appointmentComment.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Comentário excluído com sucesso' });
    } catch (error: any) {
      console.error('Erro ao excluir comentário:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

export default router;
