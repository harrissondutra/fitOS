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
 * @route GET /api/appointment-reviews
 * @desc Listar avaliações de agendamentos
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/', requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']), async (req: any, res) => {
  try {
    const { rating, appointmentId } = req.query;

    const whereClause: any = {
      appointment: {
        tenantId: req.user.tenantId
      }
    };

    if (rating) {
      whereClause.rating = parseInt(rating as string);
    }

    if (appointmentId) {
      whereClause.appointmentId = appointmentId;
    }

    // Se for TRAINER, filtrar apenas agendamentos seus
    if (req.user.role === 'TRAINER') {
      whereClause.appointment.professionalId = req.user.id;
    }

    const reviews = await prisma.appointmentReview.findMany({
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
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, reviews });
  } catch (error: any) {
    console.error('Erro ao buscar avaliações:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

/**
 * @route POST /api/appointment-reviews
 * @desc Criar avaliação de agendamento
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.post('/',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    body('appointmentId').isString().notEmpty().withMessage('ID do agendamento é obrigatório'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Avaliação deve ser entre 1 e 5'),
    body('comment').optional().isString(),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { appointmentId, rating, comment } = req.body;

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
          error: 'Você não tem permissão para avaliar este agendamento' 
        });
      }

      // Verificar se já existe avaliação para este agendamento
      const existingReview = await prisma.appointmentReview.findUnique({
        where: { appointmentId }
      });

      if (existingReview) {
        return res.status(409).json({ 
          success: false, 
          error: 'Já existe uma avaliação para este agendamento' 
        });
      }

      const review = await prisma.appointmentReview.create({
        data: {
          appointmentId,
          rating: parseInt(rating),
          comment
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
          }
        }
      });

      res.status(201).json({ success: true, review });
    } catch (error: any) {
      console.error('Erro ao criar avaliação:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/appointment-reviews/:id
 * @desc Buscar avaliação específica
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

      const review = await prisma.appointmentReview.findFirst({
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
                  name: true
                }
              }
            }
          }
        }
      });

      if (!review) {
        return res.status(404).json({ success: false, error: 'Avaliação não encontrada' });
      }

      res.json({ success: true, review });
    } catch (error: any) {
      console.error('Erro ao buscar avaliação:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route PUT /api/appointment-reviews/:id
 * @desc Atualizar avaliação
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.put('/:id',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    param('id').isString().notEmpty(),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('comment').optional().isString(),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Verificar se avaliação existe e pertence ao tenant
      const existingReview = await prisma.appointmentReview.findFirst({
        where: {
          id,
          appointment: {
            tenantId: req.user.tenantId,
            professionalId: req.user.role === 'TRAINER' ? req.user.id : undefined
          }
        }
      });

      if (!existingReview) {
        return res.status(404).json({ success: false, error: 'Avaliação não encontrada' });
      }

      const review = await prisma.appointmentReview.update({
        where: { id },
        data: {
          ...updateData,
          rating: updateData.rating ? parseInt(updateData.rating) : undefined
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
          }
        }
      });

      res.json({ success: true, review });
    } catch (error: any) {
      console.error('Erro ao atualizar avaliação:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route DELETE /api/appointment-reviews/:id
 * @desc Excluir avaliação
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

      // Verificar se avaliação existe e pertence ao tenant
      const existingReview = await prisma.appointmentReview.findFirst({
        where: {
          id,
          appointment: {
            tenantId: req.user.tenantId,
            professionalId: req.user.role === 'TRAINER' ? req.user.id : undefined
          }
        }
      });

      if (!existingReview) {
        return res.status(404).json({ success: false, error: 'Avaliação não encontrada' });
      }

      await prisma.appointmentReview.delete({
        where: { id }
      });

      res.json({ success: true, message: 'Avaliação excluída com sucesso' });
    } catch (error: any) {
      console.error('Erro ao excluir avaliação:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

export default router;
