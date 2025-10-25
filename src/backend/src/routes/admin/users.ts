import { Router } from 'express';
import { userEngagementService } from '../../services/user-engagement.service';
import { requireSuperAdmin } from '../../middleware/superAdmin';
// import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// Aplicar autenticação e autorização em todas as rotas
// router.use(authenticateToken);
router.use(requireSuperAdmin);

/**
 * GET /api/admin/users/analytics
 * Analytics de usuários
 */
router.get('/analytics', async (req, res) => {
  try {
    const engagementData = await userEngagementService.calculateAllUserEngagement();
    const metrics = await userEngagementService.getEngagementMetrics();
    const featureStats = await userEngagementService.getFeatureUsageStats();

    // Aplicar filtros se fornecidos
    const { role, tenantId, activityLevel } = req.query;
    let filteredData = engagementData;

    if (role) {
      filteredData = filteredData.filter(u => u.role === role);
    }
    if (tenantId) {
      filteredData = filteredData.filter(u => u.tenantId === tenantId);
    }
    if (activityLevel) {
      filteredData = filteredData.filter(u => u.activityLevel === activityLevel);
    }

    // Agrupar por role
    const usersByRole = filteredData.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Agrupar por nível de atividade
    const usersByActivity = filteredData.reduce((acc, user) => {
      acc[user.activityLevel] = (acc[user.activityLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Agrupar por nível de risco
    const usersByRisk = filteredData.reduce((acc, user) => {
      acc[user.riskLevel] = (acc[user.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top 10 usuários mais engajados
    const topEngagedUsers = filteredData
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 10);

    return res.json({
      success: true,
      data: {
        metrics,
        distribution: {
          byRole: usersByRole,
          byActivity: usersByActivity,
          byRisk: usersByRisk
        },
        topEngagedUsers,
        featureStats: featureStats.slice(0, 20), // Top 20 features
        allUsers: filteredData.slice(0, 100) // Limitar para performance
      }
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user analytics'
    });
  }
});

/**
 * GET /api/admin/users/activity
 * Atividade de usuários
 */
router.get('/activity', async (req, res) => {
  try {
    const { days = 30, limit = 100 } = req.query;
    
    const inactiveUsers = await userEngagementService.getInactiveUsers(Number(days));
    const powerUsers = await userEngagementService.getPowerUsers();
    const recentActivity = await req.prisma.auditLog.findMany({
      where: {
        action: 'login',
        createdAt: {
          gte: new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            tenantId: true
          }
        },
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });

    // Agrupar atividade por dia
    const activityByDay = recentActivity.reduce((acc, log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calcular estatísticas de sessão
    const sessionStats = await calculateSessionStats(Number(days), req.prisma);

    return res.json({
      success: true,
      data: {
        inactiveUsers: inactiveUsers.slice(0, 50),
        powerUsers: powerUsers.slice(0, 20),
        recentActivity,
        activityByDay,
        sessionStats,
        summary: {
          totalInactiveUsers: inactiveUsers.length,
          totalPowerUsers: powerUsers.length,
          totalLogins: recentActivity.length,
          avgLoginsPerDay: (Object.values(activityByDay) as number[]).reduce((sum: number, count: number) => sum + count, 0) / Object.keys(activityByDay).length || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user activity'
    });
  }
});

/**
 * GET /api/admin/users/engagement-metrics
 * Métricas de engajamento
 */
router.get('/engagement-metrics', async (req, res) => {
  try {
    const metrics = await userEngagementService.getEngagementMetrics();
    
    return res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching engagement metrics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch engagement metrics'
    });
  }
});

/**
 * GET /api/admin/users/feature-usage
 * Estatísticas de uso de features
 */
router.get('/feature-usage', async (req, res) => {
  try {
    const featureStats = await userEngagementService.getFeatureUsageStats();
    
    return res.json({
      success: true,
      data: featureStats
    });
  } catch (error) {
    console.error('Error fetching feature usage stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch feature usage stats'
    });
  }
});

/**
 * GET /api/admin/users/inactive
 * Usuários inativos
 */
router.get('/inactive', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const inactiveUsers = await userEngagementService.getInactiveUsers(Number(days));
    
    return res.json({
      success: true,
      data: inactiveUsers
    });
  } catch (error) {
    console.error('Error fetching inactive users:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch inactive users'
    });
  }
});

/**
 * GET /api/admin/users/power-users
 * Power users
 */
router.get('/power-users', async (req, res) => {
  try {
    const powerUsers = await userEngagementService.getPowerUsers();
    
    return res.json({
      success: true,
      data: powerUsers
    });
  } catch (error) {
    console.error('Error fetching power users:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch power users'
    });
  }
});

/**
 * POST /api/admin/users/:id/track-feature
 * Rastrear uso de feature
 */
router.post('/:id/track-feature', async (req, res) => {
  try {
    const { id } = req.params;
    const { featureName } = req.body;

    if (!featureName) {
      return res.status(400).json({
        success: false,
        error: 'Feature name is required'
      });
    }

    await userEngagementService.trackFeatureUsage(id, featureName);
    
    return res.json({
      success: true,
      message: 'Feature usage tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking feature usage:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to track feature usage'
    });
  }
});

/**
 * GET /api/admin/users/:id/engagement
 * Engajamento de usuário específico
 */
router.get('/:id/engagement', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await req.prisma.user.findUnique({
      where: { id },
      include: {
        tenant: true,
        auditLogs: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const engagementData = await userEngagementService.calculateUserEngagement(user);
    
    return res.json({
      success: true,
      data: engagementData
    });
  } catch (error) {
    console.error('Error fetching user engagement:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user engagement'
    });
  }
});

/**
 * POST /api/admin/users/bulk-actions
 * Ações em massa para usuários
 */
router.post('/bulk-actions', async (req, res) => {
  try {
    const { action, userIds, data } = req.body;

    if (!action || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        error: 'Action and userIds array are required'
      });
    }

    let results: Array<{userId: string, success: boolean, user?: any, error?: string}> = [];

    switch (action) {
      case 'suspend':
        results = await Promise.all(
          userIds.map(async (userId: string) => {
            try {
              const user = await req.prisma.user.update({
                where: { id: userId },
                data: { status: 'SUSPENDED' }
              });
              return { userId, success: true, user };
            } catch (error) {
              return { userId, success: false, error: (error as Error).message };
            }
          })
        );
        break;
      
      case 'activate':
        results = await Promise.all(
          userIds.map(async (userId: string) => {
            try {
              const user = await req.prisma.user.update({
                where: { id: userId },
                data: { status: 'ACTIVE' }
              });
              return { userId, success: true, user };
            } catch (error) {
              return { userId, success: false, error: (error as Error).message };
            }
          })
        );
        break;
      
      case 'change_role':
        if (!data?.role) {
          return res.status(400).json({
            success: false,
            error: 'Role is required for change_role action'
          });
        }
        results = await Promise.all(
          userIds.map(async (userId: string) => {
            try {
              const user = await req.prisma.user.update({
                where: { id: userId },
                data: { role: data.role }
              });
              return { userId, success: true, user };
            } catch (error) {
              return { userId, success: false, error: (error as Error).message };
            }
          })
        );
        break;
      
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return res.json({
      success: true,
      data: {
        results,
        summary: {
          total: userIds.length,
          successful: successCount,
          failed: failureCount
        }
      }
    });
  } catch (error) {
    console.error('Error executing bulk user actions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to execute bulk user actions'
    });
  }
});

/**
 * Função auxiliar para calcular estatísticas de sessão
 */
async function calculateSessionStats(days: number, prisma: any) {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const sessionLogs = await prisma.auditLog.findMany({
      where: {
        action: { in: ['login', 'logout'] },
        createdAt: { gte: startDate }
      },
      select: { action: true, createdAt: true, userId: true },
      orderBy: { createdAt: 'asc' }
    });

    let totalSessions = 0;
    let totalDuration = 0;
    const userSessions: { [userId: string]: { loginTime: Date | null; duration: number } } = {};

    for (const log of sessionLogs) {
      if (log.action === 'login') {
        userSessions[log.userId] = { loginTime: log.createdAt, duration: 0 };
      } else if (log.action === 'logout' && userSessions[log.userId]?.loginTime) {
        const userSession = userSessions[log.userId];
        if (!userSession?.loginTime) continue;
        const duration = (log.createdAt.getTime() - userSession.loginTime.getTime()) / (1000 * 60); // minutos
        userSessions[log.userId].duration = duration;
        totalSessions++;
        totalDuration += duration;
        userSessions[log.userId].loginTime = null;
      }
    }

    return {
      totalSessions,
      avgSessionDuration: totalSessions > 0 ? totalDuration / totalSessions : 0,
      uniqueUsers: Object.keys(userSessions).length
    };
  } catch (error) {
    console.error('Error calculating session stats:', error);
    return {
      totalSessions: 0,
      avgSessionDuration: 0,
      uniqueUsers: 0
    };
  }
}

export default router;
