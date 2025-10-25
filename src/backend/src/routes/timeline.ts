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
 * @route GET /api/timeline
 * @desc Buscar timeline de atividades
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/', 
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    query('clientId').optional().isString(),
    query('type').optional().isIn(['appointment', 'bioimpedance', 'crm_interaction', 'goal', 'comment']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { clientId, type, limit = 50 } = req.query;

      // Construir filtros
      const whereClause: any = {
        tenantId: req.user.tenantId
      };

      if (clientId) {
        whereClause.clientId = clientId;
      }

      // Se for TRAINER, filtrar apenas clientes atribuídos
      if (req.user.role === 'TRAINER') {
        const trainerClients = await prisma.clientTrainer.findMany({
          where: { trainerId: req.user.id },
          select: { clientId: true }
        });
        
        const clientIds = trainerClients.map(tc => tc.clientId);
        if (clientIds.length === 0) {
          return res.json({ success: true, activities: [] });
        }
        
        whereClause.clientId = { in: clientIds };
      }

      // Buscar atividades de agendamentos
      const appointmentActivities = await prisma.appointment.findMany({
        where: {
          ...whereClause,
          ...(type && type !== 'all' ? { type: type === 'appointment' ? undefined : null } : {})
        },
        include: {
          client: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string)
      });

      // Buscar atividades de bioimpedância
      const bioimpedanceActivities = await prisma.biometricData.findMany({
        where: {
          ...whereClause,
          ...(type && type !== 'all' ? { dataType: type === 'bioimpedance' ? undefined : null } : {})
        },
        include: {
          client: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { recordedAt: 'desc' },
        take: parseInt(limit as string)
      });

      // Buscar atividades de CRM
      const crmActivities = await prisma.clientInteraction.findMany({
        where: {
          ...whereClause,
          ...(type && type !== 'all' ? { type: type === 'crm_interaction' ? undefined : null } : {})
        },
        include: {
          clientProfile: {
            include: {
              client: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string)
      });

      // Buscar atividades de metas
      const goalActivities = await prisma.clientGoal.findMany({
        where: {
          ...whereClause,
          ...(type && type !== 'all' ? { type: type === 'goal' ? undefined : null } : {})
        },
        include: {
          client: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string)
      });

      // Buscar atividades de comentários
      const commentActivities = await prisma.appointmentComment.findMany({
        where: {
          ...whereClause,
          ...(type && type !== 'all' ? { type: type === 'comment' ? undefined : null } : {})
        },
        include: {
          appointment: {
            include: {
              client: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string)
      });

      // Transformar em formato unificado
      const activities = [
        ...appointmentActivities.map(apt => ({
          id: apt.id,
          type: 'appointment',
          title: `Agendamento: ${apt.title}`,
          description: `Agendado para ${apt.scheduledAt.toLocaleDateString('pt-BR')}`,
          data: {
            status: apt.status,
            duration: apt.duration,
            location: apt.location
          },
          createdAt: apt.createdAt.toISOString(),
          client: apt.client
        })),
        
        ...bioimpedanceActivities.map(bio => ({
          id: bio.id,
          type: 'bioimpedance',
          title: `Medição Biométrica: ${bio.dataType}`,
          description: `Valor: ${bio.value} ${bio.unit}`,
          data: {
            dataType: bio.dataType,
            value: bio.value,
            unit: bio.unit,
            source: bio.source
          },
          createdAt: bio.recordedAt.toISOString(),
          client: bio.client
        })),
        
        ...crmActivities.map(crm => ({
          id: crm.id,
          type: 'crm_interaction',
          title: `Interação CRM: ${crm.type}`,
          description: crm.description || 'Nova interação registrada',
          data: {
            type: crm.type,
            description: crm.description,
            subject: crm.subject
          },
          createdAt: crm.createdAt.toISOString(),
          client: crm.clientProfile.client
        })),
        
        ...goalActivities.map(goal => ({
          id: goal.id,
          type: 'goal',
          title: `Meta: ${goal.title}`,
          description: `Objetivo: ${goal.target} ${goal.unit}`,
          data: {
            type: goal.type,
            target: goal.target,
            current: goal.current,
            unit: goal.unit,
            status: goal.status
          },
          createdAt: goal.createdAt.toISOString(),
          client: goal.client
        })),
        
        ...commentActivities.map(comment => ({
          id: comment.id,
          type: 'comment',
          title: `Comentário em Agendamento`,
          description: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : ''),
          data: {
            appointmentId: comment.appointmentId,
            content: comment.content
          },
          createdAt: comment.createdAt.toISOString(),
          client: comment.appointment.client
        }))
      ];

      // Ordenar por data de criação (mais recente primeiro)
      activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Aplicar limite final
      const limitedActivities = activities.slice(0, parseInt(limit as string));

      res.json({ success: true, activities: limitedActivities });
    } catch (error: any) {
      console.error('Erro ao buscar timeline:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

export default router;
