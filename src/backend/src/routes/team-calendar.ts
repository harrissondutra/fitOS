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
 * @route GET /api/appointments/team
 * @desc Buscar agendamentos da equipe
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    query('startDate').isISO8601().withMessage('Data de início inválida'),
    query('endDate').isISO8601().withMessage('Data de fim inválida'),
    query('professionalId').optional().isString(),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { startDate, endDate, professionalId } = req.query;

      // Construir filtros
      const whereClause: any = {
        tenantId: req.user.tenantId,
        scheduledAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };

      if (professionalId && professionalId !== 'all') {
        whereClause.professionalId = professionalId;
      }

      // Se for TRAINER, mostrar apenas seus agendamentos
      if (req.user.role === 'TRAINER') {
        whereClause.professionalId = req.user.id;
      }

      const appointments = await prisma.appointment.findMany({
        where: whereClause,
        include: {
          professional: {
            select: {
              id: true,
              name: true
            }
          },
          client: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { scheduledAt: 'asc' }
      });

      // Adicionar cores para os profissionais
      const appointmentsWithColors = appointments.map((appointment, index) => ({
        ...appointment,
        professional: {
          ...appointment.professional,
          color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
        }
      }));

      res.json({ success: true, appointments: appointmentsWithColors });
    } catch (error: any) {
      console.error('Erro ao buscar agendamentos da equipe:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/appointments/team/stats
 * @desc Buscar estatísticas da equipe
 * @access ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/stats',
  requireRole(['ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    query('startDate').isISO8601().withMessage('Data de início inválida'),
    query('endDate').isISO8601().withMessage('Data de fim inválida'),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { startDate, endDate } = req.query;

      const whereClause = {
        tenantId: req.user.tenantId,
        scheduledAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };

      // Estatísticas gerais
      const totalAppointments = await prisma.appointment.count({
        where: whereClause
      });

      const completedAppointments = await prisma.appointment.count({
        where: {
          ...whereClause,
          status: 'completed'
        }
      });

      const cancelledAppointments = await prisma.appointment.count({
        where: {
          ...whereClause,
          status: 'cancelled'
        }
      });

      const noShowAppointments = await prisma.appointment.count({
        where: {
          ...whereClause,
          status: 'no_show'
        }
      });

      // Estatísticas por profissional
      const appointmentsByProfessional = await prisma.appointment.groupBy({
        by: ['professionalId'],
        where: whereClause,
        _count: {
          id: true
        },
        _avg: {
          duration: true
        }
      });

      // Buscar nomes dos profissionais
      const professionalIds = appointmentsByProfessional.map(item => item.professionalId);
      const professionals = await prisma.user.findMany({
        where: {
          id: { in: professionalIds }
        },
        select: {
          id: true,
          name: true
        }
      });

      const professionalStats = appointmentsByProfessional.map(item => {
        const professional = professionals.find(p => p.id === item.professionalId);
        return {
          professionalId: item.professionalId,
          professionalName: professional?.name || 'Desconhecido',
          totalAppointments: item._count.id,
          averageDuration: item._avg.duration || 0
        };
      });

      // Estatísticas por dia da semana
      const appointmentsByDay = await prisma.appointment.findMany({
        where: whereClause,
        select: {
          scheduledAt: true
        }
      });

      const dayStats = appointmentsByDay.reduce((acc: any, appointment) => {
        const dayOfWeek = new Date(appointment.scheduledAt).getDay();
        const dayName = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayOfWeek];
        
        if (!acc[dayName]) {
          acc[dayName] = 0;
        }
        acc[dayName]++;
        return acc;
      }, {});

      const stats = {
        total: totalAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        noShow: noShowAppointments,
        attendanceRate: totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0,
        professionalStats,
        dayStats: Object.entries(dayStats).map(([day, count]) => ({
          day,
          count
        }))
      };

      res.json({ success: true, stats });
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas da equipe:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/appointments/team/conflicts
 * @desc Verificar conflitos de agendamento
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/conflicts',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    query('startDate').isISO8601().withMessage('Data de início inválida'),
    query('endDate').isISO8601().withMessage('Data de fim inválida'),
    query('professionalId').optional().isString(),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { startDate, endDate, professionalId } = req.query;

      const whereClause: any = {
        tenantId: req.user.tenantId,
        scheduledAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        status: { not: 'cancelled' }
      };

      if (professionalId && professionalId !== 'all') {
        whereClause.professionalId = professionalId;
      }

      const appointments = await prisma.appointment.findMany({
        where: whereClause,
        include: {
          professional: {
            select: {
              id: true,
              name: true
            }
          },
          client: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { scheduledAt: 'asc' }
      });

      // Verificar conflitos de horário
      const conflicts: any[] = [];
      
      for (let i = 0; i < appointments.length; i++) {
        for (let j = i + 1; j < appointments.length; j++) {
          const apt1 = appointments[i];
          const apt2 = appointments[j];
          
          const apt1Start = new Date(apt1.scheduledAt);
          const apt1End = new Date(apt1Start.getTime() + apt1.duration * 60000);
          
          const apt2Start = new Date(apt2.scheduledAt);
          const apt2End = new Date(apt2Start.getTime() + apt2.duration * 60000);
          
          // Verificar se há sobreposição
          if (apt1Start < apt2End && apt2Start < apt1End) {
            conflicts.push({
              type: 'time_overlap',
              appointments: [apt1, apt2],
              message: `Conflito de horário entre "${apt1.title}" e "${apt2.title}"`
            });
          }
        }
      }

      res.json({ success: true, conflicts });
    } catch (error: any) {
      console.error('Erro ao verificar conflitos:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

export default router;
