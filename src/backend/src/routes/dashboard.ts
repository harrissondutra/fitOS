import { Router } from 'express';
import { getPrismaClient } from '../config/database';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/permissions';

const router = Router();
const prisma = getPrismaClient();
const authMiddleware = getAuthMiddleware();

// Middleware de autenticação para todas as rotas
router.use(authMiddleware.requireAuth);

// GET /api/dashboard/stats - Estatísticas do dashboard
router.get('/stats', requireRole(['OWNER', 'ADMIN', 'TRAINER']), async (req, res) => {
  try {
    const { range = '30d' } = req.query;
    const tenantId = req.tenantId;
    const userId = req.user?.id;

    // Calcular datas baseadas no range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Filtro por profissional se for TRAINER
    const professionalFilter = (req.user?.role as any) === 'TRAINER' ? { professionalId: userId } : {};

    // Estatísticas de agendamentos
    const appointments = await prisma.appointment.findMany({
      where: {
        tenantId,
        ...professionalFilter,
        scheduledAt: {
          gte: startDate
        }
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointmentsToday = appointments.filter(apt => 
      apt.scheduledAt >= today && apt.scheduledAt < tomorrow
    );

    const appointmentsThisWeek = appointments.filter(apt => {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      return apt.scheduledAt >= weekStart && apt.scheduledAt < weekEnd;
    });

    // Estatísticas de clientes
    const clients = await prisma.clientProfile.findMany({
      where: {
        tenantId
      },
      include: {
        client: true
      }
    });

    const activeClients = clients.filter(c => c.status === 'active');
    const atRiskClients = clients.filter(c => c.status === 'at_risk');
    const newThisMonth = clients.filter(c => {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return c.createdAt >= monthStart;
    });

    // Estatísticas de tarefas
    const tasks = await prisma.cRMTask.findMany({
      where: {
        tenantId,
        ...professionalFilter
      }
    });

    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const overdueTasks = pendingTasks.filter(t => t.dueDate && new Date(t.dueDate) < now);
    const completedTasks = tasks.filter(t => t.status === 'completed');

    // Estatísticas de bioimpedância
    const bioimpedanceMeasurements = await prisma.biometricData.findMany({
      where: {
        tenantId,
        ...professionalFilter,
        recordedAt: {
          gte: startDate
        }
      }
    });

    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const bioimpedanceThisMonth = bioimpedanceMeasurements.filter(m => 
      m.recordedAt >= thisMonth
    );

    const averageBMI = bioimpedanceMeasurements.length > 0 
      ? bioimpedanceMeasurements.reduce((sum, m) => {
          const data = m as any;
          return sum + (data.bmi || 0);
        }, 0) / bioimpedanceMeasurements.length
      : 0;

    const clientsWithGoals = await prisma.clientGoal.count({
      where: {
        tenantId,
        status: 'active'
      }
    });

    // Estatísticas de receita (simuladas)
    const revenue = {
      thisMonth: appointmentsThisWeek.length * 100, // Simulação
      lastMonth: appointments.length * 80, // Simulação
      growth: 0
    };

    if (revenue.lastMonth > 0) {
      revenue.growth = ((revenue.thisMonth - revenue.lastMonth) / revenue.lastMonth) * 100;
    }

    const stats = {
      appointments: {
        total: appointments.length,
        today: appointmentsToday.length,
        thisWeek: appointmentsThisWeek.length,
        completed: appointments.filter(a => a.status === 'completed').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
        noShow: appointments.filter(a => a.status === 'no_show').length
      },
      clients: {
        total: clients.length,
        active: activeClients.length,
        atRisk: atRiskClients.length,
        newThisMonth: newThisMonth.length
      },
      tasks: {
        total: tasks.length,
        pending: pendingTasks.length,
        overdue: overdueTasks.length,
        completed: completedTasks.length
      },
      bioimpedance: {
        totalMeasurements: bioimpedanceMeasurements.length,
        thisMonth: bioimpedanceThisMonth.length,
        averageBMI: averageBMI,
        clientsWithGoals: clientsWithGoals
      },
      revenue
    };

    res.json({ stats });
  } catch (error) {
    console.error('Erro ao obter estatísticas do dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/dashboard/activity - Atividades recentes
router.get('/activity', requireRole(['OWNER', 'ADMIN', 'TRAINER']), async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const tenantId = req.tenantId;
    const userId = req.user?.id;

    // Filtro por profissional se for TRAINER
    const professionalFilter = (req.user?.role as any) === 'TRAINER' ? { professionalId: userId } : {};

    // Buscar atividades recentes de diferentes fontes
    const recentAppointments = await prisma.appointment.findMany({
      where: {
        tenantId,
        ...professionalFilter
      },
      include: {
        client: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: Math.floor(Number(limit) / 2)
    });

    const recentTasks = await prisma.cRMTask.findMany({
      where: {
        tenantId,
        ...professionalFilter
      },
      include: {
        clientProfile: {
          include: {
            client: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: Math.floor(Number(limit) / 2)
    });

    // Converter para formato de atividade
    const activities = [
      ...recentAppointments.map(apt => ({
        id: apt.id,
        type: 'appointment' as const,
        title: apt.title,
        description: apt.description || '',
        timestamp: apt.createdAt.toISOString(),
        status: apt.status as 'completed' | 'pending' | 'overdue' | 'cancelled',
        clientName: apt.client.name
      })),
      ...recentTasks.map(task => ({
        id: task.id,
        type: 'task' as const,
        title: task.title,
        description: task.description || '',
        timestamp: task.createdAt.toISOString(),
        status: task.status as 'completed' | 'pending' | 'overdue' | 'cancelled',
        clientName: task.clientProfile?.client.name || 'Cliente não encontrado'
      }))
    ];

    // Ordenar por timestamp e limitar
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedActivities = activities.slice(0, Number(limit));

    res.json({ activities: limitedActivities });
  } catch (error) {
    console.error('Erro ao obter atividades recentes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/dashboard/upcoming-appointments - Próximos agendamentos
router.get('/upcoming-appointments', requireRole(['OWNER', 'ADMIN', 'TRAINER']), async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const tenantId = req.tenantId;
    const userId = req.user?.id;

    // Filtro por profissional se for TRAINER
    const professionalFilter = (req.user?.role as any) === 'TRAINER' ? { professionalId: userId } : {};

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        tenantId,
        ...professionalFilter,
        scheduledAt: {
          gte: new Date()
        },
        status: {
          in: ['scheduled', 'confirmed']
        }
      },
      include: {
        client: true
      },
      orderBy: {
        scheduledAt: 'asc'
      },
      take: Number(limit)
    });

    const formattedAppointments = upcomingAppointments.map(apt => ({
      id: apt.id,
      title: apt.title,
      clientName: apt.client.name,
      scheduledAt: apt.scheduledAt.toISOString(),
      duration: apt.duration,
      location: apt.location,
      isVirtual: apt.isVirtual,
      status: apt.status
    }));

    res.json({ appointments: formattedAppointments });
  } catch (error) {
    console.error('Erro ao obter próximos agendamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/dashboard/overdue-tasks - Tarefas vencidas
router.get('/overdue-tasks', requireRole(['OWNER', 'ADMIN', 'TRAINER']), async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const tenantId = req.tenantId;
    const userId = req.user?.id;

    // Filtro por profissional se for TRAINER
    const professionalFilter = (req.user?.role as any) === 'TRAINER' ? { professionalId: userId } : {};

    const overdueTasks = await prisma.cRMTask.findMany({
      where: {
        tenantId,
        ...professionalFilter,
        status: 'pending',
        dueDate: {
          lt: new Date()
        }
      },
      include: {
        clientProfile: {
          include: {
            client: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      },
      take: Number(limit)
    });

    const formattedTasks = overdueTasks.map(task => ({
      id: task.id,
      title: task.title,
      clientName: task.clientProfile?.client.name || 'Cliente não encontrado',
      dueDate: task.dueDate?.toISOString() || new Date().toISOString(),
      priority: task.priority,
      type: task.type
    }));

    res.json({ tasks: formattedTasks });
  } catch (error) {
    console.error('Erro ao obter tarefas vencidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
