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
 * @route GET /api/analytics
 * @desc Buscar dados de analytics
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/', 
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    query('period').optional().isIn(['7', '30', '90', '365']).withMessage('Período inválido'),
  ],
  async (req: any, res) => {
    try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const period = parseInt(req.query.period || '30');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - period);

      // Filtrar por tenant e profissional (se TRAINER)
      const whereClause: any = {
        tenantId: req.user.tenantId
      };

      if (req.user.role === 'TRAINER') {
        whereClause.professionalId = req.user.id;
      }

      // Buscar dados de agendamentos
      const appointments = await prisma.appointment.findMany({
        where: {
          ...whereClause,
          scheduledAt: {
            gte: startDate
          }
        },
        include: {
          client: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      // Buscar dados de bioimpedância
      const bioimpedanceData = await prisma.biometricData.findMany({
        where: {
          tenantId: req.user.tenantId,
          recordedAt: {
            gte: startDate
          }
        },
        orderBy: { recordedAt: 'asc' }
      });

      // Buscar dados de CRM
      const crmData = await prisma.clientProfile.findMany({
        where: {
          tenantId: req.user.tenantId
        },
        include: {
          _count: {
            select: {
              interactions: true
            }
          }
        }
      });

      // Buscar dados de metas
      const goals = await prisma.clientGoal.findMany({
        where: {
          tenantId: req.user.tenantId,
          createdAt: {
            gte: startDate
          }
        }
      });

      // Processar dados de agendamentos
      const appointmentsByDay = appointments.reduce((acc: any, appointment) => {
        const date = appointment.scheduledAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, count: 0, completed: 0 };
        }
        acc[date].count++;
        if (appointment.status === 'completed') {
          acc[date].completed++;
        }
        return acc;
      }, {});

      const appointmentsByType = appointments.reduce((acc: any, appointment) => {
        const type = (appointment as any).type || 'outro';
        if (!acc[type]) {
          acc[type] = { type, count: 0 };
        }
        acc[type].count++;
        return acc;
      }, {});

      // Processar dados de bioimpedância
      const progressData = bioimpedanceData.reduce((acc: any, data) => {
        const date = data.recordedAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, weight: 0, bodyFat: 0, count: 0 };
        }
        
        if (data.dataType === 'weight') {
          acc[date].weight += data.value;
        } else if (data.dataType === 'body_fat_percentage') {
          acc[date].bodyFat += data.value;
        }
        acc[date].count++;
        return acc;
      }, {});

      // Calcular médias
      Object.keys(progressData).forEach(date => {
        const data = progressData[date];
        if (data.count > 0) {
          data.weight = data.weight / data.count;
          data.bodyFat = data.bodyFat / data.count;
        }
      });

      // Processar dados de CRM
      const pipeline = crmData.reduce((acc: any, profile) => {
        const stage = (profile as any).stage || 'prospect';
        if (!acc[stage]) {
          acc[stage] = { stage, count: 0 };
        }
        acc[stage].count++;
        return acc;
      }, {});

      // Processar conversões (simulado)
      const conversions: any[] = [];
      for (let i = 0; i < period; i += 7) {
        const date = new Date();
        date.setDate(date.getDate() - period + i);
        conversions.push({
          month: date.toISOString(),
          prospects: Math.floor(Math.random() * 10) + 5,
          clients: Math.floor(Math.random() * 5) + 2
        });
      }

      // Processar metas
      const goalsStats = {
        total: goals.length,
        achieved: goals.filter(g => g.status === 'achieved').length,
        inProgress: goals.filter(g => g.status === 'active').length,
        overdue: goals.filter(g => {
          const now = new Date();
          const targetDate = new Date(g.targetDate);
          return g.status === 'active' && targetDate < now;
        }).length
      };

      const analyticsData = {
        appointments: {
          total: appointments.length,
          completed: appointments.filter(a => a.status === 'completed').length,
          cancelled: appointments.filter(a => a.status === 'cancelled').length,
          noShow: appointments.filter(a => a.status === 'no_show').length,
          byDay: Object.values(appointmentsByDay),
          byType: Object.values(appointmentsByType)
        },
        bioimpedance: {
          totalMeasurements: bioimpedanceData.length,
          averageWeight: bioimpedanceData
            .filter(d => d.dataType === 'weight')
            .reduce((sum, d) => sum + d.value, 0) / 
            Math.max(bioimpedanceData.filter(d => d.dataType === 'weight').length, 1),
          averageBodyFat: bioimpedanceData
            .filter(d => d.dataType === 'body_fat_percentage')
            .reduce((sum, d) => sum + d.value, 0) / 
            Math.max(bioimpedanceData.filter(d => d.dataType === 'body_fat_percentage').length, 1),
          progressData: Object.values(progressData)
        },
        crm: {
          totalClients: crmData.length,
          activeClients: crmData.filter(c => (c as any).stage === 'active').length,
          pipeline: Object.values(pipeline),
          conversions
        },
        goals: goalsStats
      };

      res.json({ success: true, data: analyticsData });
    } catch (error: any) {
      console.error('Erro ao buscar analytics:', error);
      res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
  }
);

export default router;