import { Router } from 'express';
import { revenueAnalyticsService } from '../../services/revenue-analytics.service';
import { requireSuperAdmin } from '../../middleware/superAdmin';
// import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// Aplicar autenticação e autorização em todas as rotas
// router.use(authenticateToken);
router.use(requireSuperAdmin);

/**
 * GET /api/admin/revenue/dashboard
 * Dashboard de receita
 */
router.get('/dashboard', async (req, res) => {
  try {
    const metrics = await revenueAnalyticsService.getCurrentRevenueMetrics();
    const trends = await revenueAnalyticsService.getRevenueTrends(12);
    const revenueByPlan = await revenueAnalyticsService.getRevenueByPlan();
    const cohortAnalysis = await revenueAnalyticsService.getCohortAnalysis();
    const forecast = await revenueAnalyticsService.getRevenueForecast(6);

    // Calcular growth rate
    const currentMrr = metrics.mrr;
    const previousMrr = trends.length > 1 ? trends[trends.length - 2].mrr : currentMrr;
    const growthRate = previousMrr > 0 ? ((currentMrr - previousMrr) / previousMrr) * 100 : 0;

    // Calcular revenue churn
    const revenueChurn = metrics.contractionRevenue > 0 ? (metrics.contractionRevenue / currentMrr) * 100 : 0;

    return res.json({
      success: true,
      data: {
        metrics: {
          ...metrics,
          growthRate: Math.round(growthRate * 100) / 100,
          revenueChurn: Math.round(revenueChurn * 100) / 100
        },
        trends,
        revenueByPlan,
        cohortAnalysis,
        forecast,
        summary: {
          mrr: Math.round(metrics.mrr),
          arr: Math.round(metrics.arr),
          churnRate: Math.round(metrics.churnRate * 100) / 100,
          ltv: Math.round(metrics.ltv),
          cac: Math.round(metrics.cac),
          ltvCacRatio: Math.round(metrics.ltvCacRatio * 100) / 100
        }
      }
    });
  } catch (error) {
    console.error('Error fetching revenue dashboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue dashboard data'
    });
  }
});

/**
 * GET /api/admin/revenue/metrics
 * Métricas de receita atuais
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await revenueAnalyticsService.getCurrentRevenueMetrics();
    
    return res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching revenue metrics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue metrics'
    });
  }
});

/**
 * GET /api/admin/revenue/trends
 * Tendências de receita
 */
router.get('/trends', async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const trends = await revenueAnalyticsService.getRevenueTrends(Number(months));
    
    return res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error fetching revenue trends:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue trends'
    });
  }
});

/**
 * GET /api/admin/revenue/by-plan
 * Receita por plano
 */
router.get('/by-plan', async (req, res) => {
  try {
    const revenueByPlan = await revenueAnalyticsService.getRevenueByPlan();
    
    return res.json({
      success: true,
      data: revenueByPlan
    });
  } catch (error) {
    console.error('Error fetching revenue by plan:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue by plan'
    });
  }
});

/**
 * GET /api/admin/revenue/cohort-analysis
 * Análise de coorte
 */
router.get('/cohort-analysis', async (req, res) => {
  try {
    const cohortAnalysis = await revenueAnalyticsService.getCohortAnalysis();
    
    return res.json({
      success: true,
      data: cohortAnalysis
    });
  } catch (error) {
    console.error('Error fetching cohort analysis:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch cohort analysis'
    });
  }
});

/**
 * GET /api/admin/revenue/forecast
 * Previsão de receita
 */
router.get('/forecast', async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const forecast = await revenueAnalyticsService.getRevenueForecast(Number(months));
    
    return res.json({
      success: true,
      data: forecast
    });
  } catch (error) {
    console.error('Error fetching revenue forecast:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue forecast'
    });
  }
});

/**
 * POST /api/admin/revenue/save-metrics
 * Salvar métricas de receita
 */
router.post('/save-metrics', async (req, res) => {
  try {
    const metrics = await revenueAnalyticsService.getCurrentRevenueMetrics();
    await revenueAnalyticsService.saveRevenueMetrics(metrics);
    
    return res.json({
      success: true,
      message: 'Revenue metrics saved successfully'
    });
  } catch (error) {
    console.error('Error saving revenue metrics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save revenue metrics'
    });
  }
});

/**
 * GET /api/admin/revenue/billing-issues
 * Problemas de billing
 */
router.get('/billing-issues', async (req, res) => {
  try {
    // Buscar assinaturas com problemas
    const failedSubscriptions = await req.prisma.subscription.findMany({
      where: {
        status: 'past_due'
      },
      include: {
        tenant: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Buscar tentativas de pagamento falhadas
    const failedPayments = await req.prisma.auditLog.findMany({
      where: {
        action: 'payment_failed',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 dias
        }
      },
      include: {
        tenant: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Buscar cartões expirados (simulado)
    const expiredCards = await req.prisma.subscription.findMany({
      where: {
        status: 'active',
        nextBillingDate: {
          lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Próximos 7 dias
        }
      },
      include: {
        tenant: true
      }
    });

    return res.json({
      success: true,
      data: {
        failedSubscriptions,
        failedPayments,
        expiredCards,
        summary: {
          totalIssues: failedSubscriptions.length + failedPayments.length + expiredCards.length,
          failedSubscriptions: failedSubscriptions.length,
          failedPayments: failedPayments.length,
          expiredCards: expiredCards.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching billing issues:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch billing issues'
    });
  }
});

/**
 * POST /api/admin/revenue/retry-payment
 * Tentar novamente pagamento falhado
 */
router.post('/retry-payment', async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'Subscription ID is required'
      });
    }

    // Buscar assinatura
    const subscription = await req.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { tenant: true }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    // Simular retry de pagamento
    // Em um sistema real, aqui seria feita a integração com o gateway de pagamento
    const retrySuccess = Math.random() > 0.3; // 70% de chance de sucesso

    if (retrySuccess) {
      await req.prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'active' }
      });

      return res.json({
        success: true,
        message: 'Payment retry successful'
      });
    } else {
      return res.json({
        success: false,
        message: 'Payment retry failed'
      });
    }
  } catch (error) {
    console.error('Error retrying payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retry payment'
    });
  }
});

/**
 * GET /api/admin/revenue/refunds
 * Lista de reembolsos
 */
router.get('/refunds', async (req, res) => {
  try {
    const refunds = await req.prisma.auditLog.findMany({
      where: {
        action: 'refund',
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Últimos 90 dias
        }
      },
      include: {
        tenant: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: refunds
    });
  } catch (error) {
    console.error('Error fetching refunds:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch refunds'
    });
  }
});

/**
 * POST /api/admin/revenue/process-refund
 * Processar reembolso
 */
router.post('/process-refund', async (req, res) => {
  try {
    const { subscriptionId, amount, reason } = req.body;

    if (!subscriptionId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Subscription ID and amount are required'
      });
    }

    // Buscar assinatura
    const subscription = await req.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { tenant: true }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    // Simular processamento de reembolso
    // Em um sistema real, aqui seria feita a integração com o gateway de pagamento
    const refundSuccess = Math.random() > 0.1; // 90% de chance de sucesso

    if (refundSuccess) {
      // Registrar reembolso no audit log
      await req.prisma.auditLog.create({
        data: {
          userId: req.user?.id || 'system',
          tenantId: subscription.tenantId,
          action: 'refund',
          entityType: 'Subscription',
          entityId: subscriptionId,
          changes: {
            amount,
            reason,
            status: 'processed'
          }
        }
      });

      return res.json({
        success: true,
        message: 'Refund processed successfully'
      });
    } else {
      return res.json({
        success: false,
        message: 'Refund processing failed'
      });
    }
  } catch (error) {
    console.error('Error processing refund:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process refund'
    });
  }
});

export default router;
