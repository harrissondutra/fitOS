import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { revenueAnalyticsService } from '../../services/revenue-analytics.service';
import { customerHealthService } from '../../services/customer-health.service';
import { userEngagementService } from '../../services/user-engagement.service';
import { requireSuperAdmin } from '../../middleware/superAdmin';
// import { authenticateToken } from '../../middleware/auth.middleware';

const prisma = new PrismaClient();

const router = Router();

// Aplicar autenticação e autorização em todas as rotas
// router.use(authenticateToken);
router.use(requireSuperAdmin);

/**
 * GET /api/admin/platform/overview
 * Visão geral da plataforma
 */
router.get('/overview', async (req, res) => {
  try {
    // Buscar dados básicos
    const totalTenants = await prisma.tenant.count();
    const activeTenants = await prisma.tenant.count({ where: { status: 'active' } });
    const trialTenants = await prisma.tenant.count({ where: { status: 'trial' } });
    const churnedTenants = await prisma.tenant.count({ where: { status: 'inactive' } });

    const totalUsers = await prisma.user.count();
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });

    // Métricas de receita
    const revenueMetrics = await revenueAnalyticsService.getCurrentRevenueMetrics();
    const revenueByPlan = await revenueAnalyticsService.getRevenueByPlan();

    // Métricas de health
    const healthMetrics = await customerHealthService.getHealthMetrics();

    // Métricas de engajamento
    const engagementMetrics = await userEngagementService.getEngagementMetrics();

    // Top 10 tenants por receita
    const topTenantsByRevenue = await prisma.tenant.findMany({
      include: {
        subscriptions: {
          where: { status: 'active' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Calcular receita por tenant
    const tenantsWithRevenue = topTenantsByRevenue.map(tenant => {
      const mrr = tenant.subscriptions.reduce((sum, sub) => {
        return sum + (sub.planId === 'monthly' ? 100 : 100 / 12); // Mock values
      }, 0);
      return {
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan,
        mrr: Math.round(mrr),
        userCount: 0 // Será preenchido abaixo
      };
    });

    // Buscar contagem de usuários para cada tenant
    for (const tenant of tenantsWithRevenue) {
      const userCount = await prisma.user.count({
        where: { tenantId: tenant.id }
      });
      tenant.userCount = userCount;
    }

    // Ordenar por MRR
    tenantsWithRevenue.sort((a, b) => b.mrr - a.mrr);

    // Calcular growth metrics
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newTenantsThisMonth = await prisma.tenant.count({
      where: {
        createdAt: { gte: thisMonth }
      }
    });

    const newTenantsLastMonth = await prisma.tenant.count({
      where: {
        createdAt: { gte: lastMonth, lt: thisMonth }
      }
    });

    const tenantGrowthRate = newTenantsLastMonth > 0 
      ? ((newTenantsThisMonth - newTenantsLastMonth) / newTenantsLastMonth) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        tenants: {
          total: totalTenants,
          active: activeTenants,
          trial: trialTenants,
          churned: churnedTenants,
          growthRate: Math.round(tenantGrowthRate * 100) / 100
        },
        users: {
          total: totalUsers,
          byRole: usersByRole.reduce((acc, item) => {
            acc[item.role || 'CLIENT'] = item._count.role;
            return acc;
          }, {} as Record<string, number>)
        },
        revenue: {
          mrr: Math.round(revenueMetrics.mrr),
          arr: Math.round(revenueMetrics.arr),
          churnRate: Math.round(revenueMetrics.churnRate * 100) / 100,
          ltv: Math.round(revenueMetrics.ltv),
          byPlan: revenueByPlan
        },
        health: {
          avgScore: Math.round(healthMetrics.avgHealthScore),
          healthy: healthMetrics.healthyTenants,
          atRisk: healthMetrics.atRiskTenants,
          critical: healthMetrics.criticalTenants
        },
        engagement: {
          activeUsers: engagementMetrics.activeUsers,
          inactiveUsers: engagementMetrics.inactiveUsers,
          avgScore: Math.round(engagementMetrics.avgEngagementScore),
          highEngagement: engagementMetrics.highEngagementUsers
        },
        topTenants: tenantsWithRevenue.slice(0, 10),
        platformHealth: {
          score: calculatePlatformHealthScore(
            revenueMetrics.mrr,
            healthMetrics.avgHealthScore,
            engagementMetrics.avgEngagementScore,
            tenantGrowthRate
          ),
          status: getPlatformHealthStatus(
            revenueMetrics.mrr,
            healthMetrics.avgHealthScore,
            engagementMetrics.avgEngagementScore
          )
        }
      }
    });
  } catch (error) {
    console.error('Error fetching platform overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform overview'
    });
  }
});

/**
 * GET /api/admin/platform/growth
 * Análise de crescimento
 */
router.get('/growth', async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const monthsCount = Number(months);
    const now = new Date();

    // Novos tenants por mês
    const newTenantsByMonth: Array<{month: string, newTenants: number, cumulative: number}> = [];
    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const newTenants = await prisma.tenant.count({
        where: {
          createdAt: { gte: monthStart, lt: monthEnd }
        }
      });

      newTenantsByMonth.push({
        month: monthStart.toISOString().substring(0, 7),
        newTenants,
        cumulative: 0 // Será calculado abaixo
      });
    }

    // Calcular cumulative
    let cumulative = 0;
    for (const month of newTenantsByMonth) {
      cumulative += month.newTenants;
      month.cumulative = cumulative;
    }

    // Funil de aquisição
    const acquisitionFunnel = await calculateAcquisitionFunnel(monthsCount);

    // Taxas de conversão
    const conversionRates = await calculateConversionRates();

    // Receita de expansão
    const expansionRevenue = await calculateExpansionRevenue(monthsCount);

    // Análise de coorte de retenção
    const retentionCohorts = await calculateRetentionCohorts(monthsCount);

    // Previsão de crescimento
    const growthForecast = await calculateGrowthForecast(newTenantsByMonth);

    res.json({
      success: true,
      data: {
        newTenantsByMonth,
        acquisitionFunnel,
        conversionRates,
        expansionRevenue,
        retentionCohorts,
        growthForecast,
        summary: {
          totalNewTenants: newTenantsByMonth.reduce((sum, m) => sum + m.newTenants, 0),
          avgNewTenantsPerMonth: newTenantsByMonth.reduce((sum, m) => sum + m.newTenants, 0) / monthsCount,
          growthTrend: calculateGrowthTrend(newTenantsByMonth)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching growth analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch growth analytics'
    });
  }
});

/**
 * GET /api/admin/platform/features
 * Análise de adoção de features
 */
router.get('/features', async (req, res) => {
  try {
    const featureStats = await userEngagementService.getFeatureUsageStats();
    
    // Features mais usadas
    const mostUsedFeatures = featureStats.slice(0, 20);

    // Features não usadas (candidatas para depreciação)
    const allFeatures = await prisma.auditLog.findMany({
      select: { action: true },
      distinct: ['action']
    });

    const usedFeatureNames = new Set(featureStats.map(f => f.featureName));
    const unusedFeatures = allFeatures
      .filter(f => !usedFeatureNames.has(f.action))
      .map(f => f.action);

    // Taxa de adoção por feature
    const totalUsers = await prisma.user.count();
    const adoptionRates = featureStats.map(feature => ({
      ...feature,
      adoptionRate: totalUsers > 0 ? (feature.uniqueUsers / totalUsers) * 100 : 0
    }));

    // Features por plano
    const featuresByPlan = await calculateFeaturesByPlan();

    // Correlação com retenção
    const retentionCorrelation = await calculateFeatureRetentionCorrelation(featureStats);

    // Tendências de features
    const featureTrends = await calculateFeatureTrends();

    res.json({
      success: true,
      data: {
        mostUsedFeatures,
        unusedFeatures,
        adoptionRates,
        featuresByPlan,
        retentionCorrelation,
        featureTrends,
        summary: {
          totalFeatures: allFeatures.length,
          activelyUsedFeatures: featureStats.length,
          unusedFeaturesCount: unusedFeatures.length,
          avgAdoptionRate: adoptionRates.reduce((sum, f) => sum + f.adoptionRate, 0) / adoptionRates.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching feature analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feature analytics'
    });
  }
});

/**
 * Função auxiliar para calcular health score da plataforma
 */
function calculatePlatformHealthScore(mrr: number, avgHealthScore: number, avgEngagementScore: number, growthRate: number): number {
  // Normalizar métricas para 0-100
  const mrrScore = Math.min(100, (mrr / 10000) * 100); // Assumir 10k MRR como 100%
  const healthScore = avgHealthScore;
  const engagementScore = avgEngagementScore;
  const growthScore = Math.min(100, Math.max(0, 50 + growthRate)); // 0% growth = 50, 50% growth = 100

  // Média ponderada
  return Math.round(
    (mrrScore * 0.3) + 
    (healthScore * 0.3) + 
    (engagementScore * 0.25) + 
    (growthScore * 0.15)
  );
}

/**
 * Função auxiliar para determinar status de health da plataforma
 */
function getPlatformHealthStatus(mrr: number, avgHealthScore: number, avgEngagementScore: number): string {
  const healthScore = calculatePlatformHealthScore(mrr, avgHealthScore, avgEngagementScore, 0);
  
  if (healthScore >= 80) return 'excellent';
  if (healthScore >= 60) return 'good';
  if (healthScore >= 40) return 'fair';
  if (healthScore >= 20) return 'poor';
  return 'critical';
}

/**
 * Função auxiliar para calcular funil de aquisição
 */
async function calculateAcquisitionFunnel(months: number) {
  // Simular dados de funil (em um sistema real, isso viria de analytics de marketing)
  return {
    landingPageVisits: 10000,
    signUps: 5000,
    trialStarts: 3000,
    paidConversions: 1500,
    conversionRates: {
      signUpToTrial: 60,
      trialToPaid: 50,
      overall: 15
    }
  };
}

/**
 * Função auxiliar para calcular taxas de conversão
 */
async function calculateConversionRates() {
  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const trialTenants = await prisma.tenant.count({
    where: { status: 'trial' }
  });

  const paidTenants = await prisma.tenant.count({
    where: { 
      status: 'active',
      plan: { not: 'trial' }
    }
  });

  const newTrials = await prisma.tenant.count({
    where: {
      status: 'trial',
      createdAt: { gte: last30Days }
    }
  });

  const newPaid = await prisma.tenant.count({
    where: {
      status: 'active',
      plan: { not: 'trial' },
      createdAt: { gte: last30Days }
    }
  });

  return {
    trialToPaid: trialTenants > 0 ? (paidTenants / trialTenants) * 100 : 0,
    newTrialConversion: newTrials > 0 ? (newPaid / newTrials) * 100 : 0,
    overallConversion: (trialTenants + paidTenants) > 0 ? (paidTenants / (trialTenants + paidTenants)) * 100 : 0
  };
}

/**
 * Função auxiliar para calcular receita de expansão
 */
async function calculateExpansionRevenue(months: number) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

  const expansionRevenue = await prisma.auditLog.findMany({
    where: {
      action: 'update',
      entityType: 'Subscription',
      createdAt: { gte: startDate },
      changes: {
        path: ['plan'],
        not: Prisma.JsonNull
      }
    },
      include: { tenant: true }
  });

  let totalExpansion = 0;
  for (const change of expansionRevenue) {
    if (change.tenant) {
      const oldPlan = getPlanValue(change.changes as string);
      const newPlan = getPlanValue(change.tenant.plan);
      
      if (newPlan > oldPlan) {
        totalExpansion += newPlan - oldPlan;
      }
    }
  }

  return totalExpansion;
}

/**
 * Função auxiliar para calcular coortes de retenção
 */
async function calculateRetentionCohorts(months: number) {
  // Implementação simplificada
  return [];
}

/**
 * Função auxiliar para calcular previsão de crescimento
 */
async function calculateGrowthForecast(newTenantsByMonth: any[]) {
  if (newTenantsByMonth.length < 3) return [];

  const recentMonths = newTenantsByMonth.slice(-3);
  const avgGrowth = recentMonths.reduce((sum, m) => sum + m.newTenants, 0) / recentMonths.length;
  
  return [
    { month: 'Next Month', predicted: Math.round(avgGrowth * 1.1) },
    { month: 'Month +2', predicted: Math.round(avgGrowth * 1.2) },
    { month: 'Month +3', predicted: Math.round(avgGrowth * 1.3) }
  ];
}

/**
 * Função auxiliar para calcular tendência de crescimento
 */
function calculateGrowthTrend(newTenantsByMonth: any[]): string {
  if (newTenantsByMonth.length < 2) return 'stable';

  const recent = newTenantsByMonth.slice(-3);
  const older = newTenantsByMonth.slice(-6, -3);

  const recentAvg = recent.reduce((sum, m) => sum + m.newTenants, 0) / recent.length;
  const olderAvg = older.length > 0 ? older.reduce((sum, m) => sum + m.newTenants, 0) / older.length : recentAvg;

  if (recentAvg > olderAvg * 1.1) return 'growing';
  if (recentAvg < olderAvg * 0.9) return 'declining';
  return 'stable';
}

/**
 * Função auxiliar para calcular features por plano
 */
async function calculateFeaturesByPlan() {
  // Implementação simplificada
  return [];
}

/**
 * Função auxiliar para calcular correlação de features com retenção
 */
async function calculateFeatureRetentionCorrelation(featureStats: any[]) {
  // Implementação simplificada
  return featureStats.map(f => ({
    feature: f.featureName,
    correlation: Math.random() * 0.5 + 0.3 // Simulado
  }));
}

/**
 * Função auxiliar para calcular tendências de features
 */
async function calculateFeatureTrends() {
  // Implementação simplificada
  return [];
}

/**
 * Função auxiliar para obter valor do plano
 */
function getPlanValue(plan: string): number {
  const planValues: { [key: string]: number } = {
    'trial': 0,
    'starter': 29,
    'basic': 59,
    'professional': 99,
    'enterprise': 199
  };
  return planValues[plan] || 0;
}

export default router;
