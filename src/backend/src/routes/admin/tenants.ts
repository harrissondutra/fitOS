import { Router } from 'express';
import { tenantLifecycleService } from '../../services/tenant-lifecycle.service';
import { customerHealthService } from '../../services/customer-health.service';
import { requireSuperAdmin } from '../../middleware/superAdmin';
// import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// Aplicar autenticação e autorização em todas as rotas
// router.use(authenticateToken);
router.use(requireSuperAdmin);

/**
 * GET /api/admin/tenants/dashboard
 * Dashboard de gestão de tenants
 */
router.get('/dashboard', async (req, res) => {
  try {
    const lifecycleData = await tenantLifecycleService.analyzeAllTenants();
    const healthData = await customerHealthService.calculateAllCustomerHealth();
    const upgradeOpportunities = await tenantLifecycleService.findUpgradeOpportunities();
    const churnPredictions = await tenantLifecycleService.predictChurn();

    // Agrupar dados por estágio
    const stageDistribution = lifecycleData.reduce((acc, tenant) => {
      acc[tenant.stage] = (acc[tenant.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calcular métricas gerais
    const totalTenants = lifecycleData.length;
    const activeTenants = lifecycleData.filter(t => t.stage === 'active').length;
    const atRiskTenants = lifecycleData.filter(t => t.stage === 'at_risk').length;
    const avgHealthScore = healthData.length > 0 
      ? healthData.reduce((sum, h) => sum + h.healthScore, 0) / healthData.length 
      : 0;

    return res.json({
      success: true,
      data: {
        overview: {
          totalTenants,
          activeTenants,
          atRiskTenants,
          avgHealthScore: Math.round(avgHealthScore)
        },
        stageDistribution,
        lifecycleData: lifecycleData.slice(0, 50), // Top 50 para performance
        healthData: healthData.slice(0, 50),
        upgradeOpportunities: upgradeOpportunities.slice(0, 20),
        churnPredictions: churnPredictions.slice(0, 20)
      }
    });
  } catch (error) {
    console.error('Error fetching tenant dashboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch tenant dashboard data'
    });
  }
});

/**
 * GET /api/admin/tenants/:id/analytics
 * Analytics detalhados de um tenant específico
 */
router.get('/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar dados do tenant
    const tenant = await req.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: true,
        subscriptions: true,
        usageTracking: true,
        auditLogs: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Últimos 90 dias
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 100
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    // Calcular analytics
    const lifecycleData = await tenantLifecycleService.analyzeTenantLifecycle(tenant);
    const healthData = await customerHealthService.calculateCustomerHealth(tenant);

    // Usuários ativos vs inativos
    const activeUsers = tenant.users.filter(user => 
      user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const inactiveUsers = tenant.users.filter(user => 
      !user.lastLogin || new Date(user.lastLogin) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    // Features mais usadas
    const featureUsage = await req.prisma.featureUsage.findMany({
      where: { tenantId: id },
      select: { featureName: true, usageCount: true },
      orderBy: { usageCount: 'desc' },
      take: 10
    });

    // Histórico de receita (últimos 12 meses)
    const revenueHistory = await req.prisma.revenueMetric.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Atividade recente
    const recentActivity = tenant.auditLogs.slice(0, 20);

    return res.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
          status: tenant.status,
          createdAt: tenant.createdAt,
          lastActivity: lifecycleData.lastActivity
        },
        lifecycle: lifecycleData,
        health: healthData,
        users: {
          total: tenant.users.length,
          active: activeUsers.length,
          inactive: inactiveUsers.length,
          breakdown: tenant.users.reduce((acc, user) => {
            acc[user.role || 'CLIENT'] = (acc[user.role || 'CLIENT'] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        },
        features: {
          mostUsed: featureUsage,
          totalFeatures: featureUsage.length
        },
        revenue: {
          current: tenant.subscriptions.find(s => s.status === 'active')?.amount || 0,
          history: revenueHistory
        },
        activity: recentActivity
      }
    });
  } catch (error) {
    console.error('Error fetching tenant analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch tenant analytics'
    });
  }
});

/**
 * GET /api/admin/tenants/at-risk
 * Lista de tenants em risco
 */
router.get('/at-risk', async (req, res) => {
  try {
    const atRiskTenants = await customerHealthService.getAtRiskTenants();
    
    return res.json({
      success: true,
      data: atRiskTenants
    });
  } catch (error) {
    console.error('Error fetching at-risk tenants:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch at-risk tenants'
    });
  }
});

/**
 * GET /api/admin/tenants/upgrade-opportunities
 * Oportunidades de upgrade
 */
router.get('/upgrade-opportunities', async (req, res) => {
  try {
    const opportunities = await tenantLifecycleService.findUpgradeOpportunities();
    
    return res.json({
      success: true,
      data: opportunities
    });
  } catch (error) {
    console.error('Error fetching upgrade opportunities:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch upgrade opportunities'
    });
  }
});

/**
 * GET /api/admin/tenants/churn-predictions
 * Predições de churn
 */
router.get('/churn-predictions', async (req, res) => {
  try {
    const predictions = await tenantLifecycleService.predictChurn();
    
    return res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Error fetching churn predictions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch churn predictions'
    });
  }
});

/**
 * POST /api/admin/tenants/:id/actions
 * Executar ações em tenant (suspend, activate, change plan)
 */
router.post('/:id/actions', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, data } = req.body;

    const tenant = await req.prisma.tenant.findUnique({
      where: { id }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant not found'
      });
    }

    let result;

    switch (action) {
      case 'suspend':
        result = await req.prisma.tenant.update({
          where: { id },
          data: { status: 'suspended' }
        });
        break;
      
      case 'activate':
        result = await req.prisma.tenant.update({
          where: { id },
          data: { status: 'active' }
        });
        break;
      
      case 'change_plan':
        if (!data?.plan) {
          return res.status(400).json({
            success: false,
            error: 'Plan is required for change_plan action'
          });
        }
        result = await req.prisma.tenant.update({
          where: { id },
          data: { plan: data.plan }
        });
        break;
      
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error executing tenant action:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to execute tenant action'
    });
  }
});

/**
 * GET /api/admin/tenants/health-metrics
 * Métricas de health de todos os tenants
 */
router.get('/health-metrics', async (req, res) => {
  try {
    const metrics = await customerHealthService.getHealthMetrics();
    const trends = await customerHealthService.getHealthTrends(6);
    
    return res.json({
      success: true,
      data: {
        metrics,
        trends
      }
    });
  } catch (error) {
    console.error('Error fetching health metrics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch health metrics'
    });
  }
});

export default router;
