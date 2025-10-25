import { Router } from 'express';
import { ReportGenerationService } from '../../services/report-generation.service';
import { requireSuperAdmin } from '../../middleware/superAdmin';
// import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();
const reportGenerationService = new ReportGenerationService();

// Aplicar autenticação e autorização em todas as rotas
// router.use(authenticateToken);
router.use(requireSuperAdmin);

/**
 * POST /api/admin/reports/generate
 * Gerar relatório customizado
 */
router.post('/generate', async (req, res) => {
  try {
    const { type, dateRange, filters, format, includeCharts, metrics } = req.body;

    if (!type || !dateRange) {
      return res.status(400).json({
        success: false,
        error: 'Type and dateRange are required'
      });
    }

    const config = {
      type,
      dateRange: {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      },
      filters: filters || {},
      format: format || 'pdf',
      includeCharts: includeCharts || false,
      metrics: metrics || []
    };

    const reportData = await reportGenerationService.generateReport(config);

    return res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

/**
 * POST /api/admin/reports/export
 * Exportar relatório
 */
router.post('/export', async (req, res) => {
  try {
    const { reportData, format } = req.body;

    if (!reportData || !format) {
      return res.status(400).json({
        success: false,
        error: 'ReportData and format are required'
      });
    }

    let exportData: Buffer | string;

    switch (format) {
      case 'pdf':
        exportData = await reportGenerationService.exportToPDF(reportData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
        break;
      case 'excel':
        exportData = await reportGenerationService.exportToExcel(reportData);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');
        break;
      case 'csv':
        exportData = await reportGenerationService.exportToCSV(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid format. Supported formats: pdf, excel, csv'
        });
    }

    return res.send(exportData);
  } catch (error) {
    console.error('Error exporting report:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to export report'
    });
  }
});

/**
 * GET /api/admin/reports/executive
 * Dashboard executivo
 */
router.get('/executive', async (req, res) => {
  try {
    // Buscar métricas principais
    const totalTenants = await req.prisma.tenant.count();
    const activeTenants = await req.prisma.tenant.count({ where: { status: 'active' } });
    const totalUsers = await req.prisma.user.count();
    
    // Buscar métricas de receita
    const revenueMetrics = await req.prisma.revenueMetric.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // Calcular crescimento
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newTenantsThisMonth = await req.prisma.tenant.count({
      where: { createdAt: { gte: thisMonth } }
    });

    const newTenantsLastMonth = await req.prisma.tenant.count({
      where: { 
        createdAt: { gte: lastMonth, lt: thisMonth }
      }
    });

    const tenantGrowthRate = newTenantsLastMonth > 0 
      ? ((newTenantsThisMonth - newTenantsLastMonth) / newTenantsLastMonth) * 100 
      : 0;

    // Calcular churn rate
    const churnedTenants = await req.prisma.tenant.count({
      where: {
        status: 'inactive',
        updatedAt: { gte: lastMonth }
      }
    });

    const churnRate = activeTenants > 0 ? (churnedTenants / activeTenants) * 100 : 0;

    // Calcular LTV (simplificado)
    const avgMrr = revenueMetrics?.mrr || 0;
    const ltv = churnRate > 0 ? (avgMrr * 12) / (churnRate / 100) : avgMrr * 12;

    return res.json({
      success: true,
      data: {
        kpis: {
          mrr: Math.round(revenueMetrics?.mrr || 0),
          arr: Math.round((revenueMetrics?.arr || 0)),
          totalTenants,
          activeTenants,
          totalUsers,
          churnRate: Math.round(churnRate * 100) / 100,
          ltv: Math.round(ltv)
        },
        trends: {
          tenantGrowth: {
            current: newTenantsThisMonth,
            previous: newTenantsLastMonth,
            rate: Math.round(tenantGrowthRate * 100) / 100,
            direction: tenantGrowthRate > 0 ? 'up' : tenantGrowthRate < 0 ? 'down' : 'stable'
          },
          revenue: {
            current: revenueMetrics?.mrr || 0,
            previous: 0, // Seria calculado com dados históricos
            rate: 0,
            direction: 'stable'
          }
        },
        goals: {
          mrr: 50000, // Meta de MRR
          tenants: 1000, // Meta de tenants
          churnRate: 5, // Meta de churn rate
          ltv: 5000 // Meta de LTV
        },
        status: {
          overall: tenantGrowthRate > 0 && churnRate < 10 ? 'on_track' : 'needs_attention',
          revenue: revenueMetrics?.mrr && revenueMetrics.mrr > 10000 ? 'on_track' : 'needs_attention',
          growth: tenantGrowthRate > 0 ? 'on_track' : 'needs_attention',
          retention: churnRate < 10 ? 'on_track' : 'needs_attention'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching executive dashboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch executive dashboard'
    });
  }
});

/**
 * POST /api/admin/reports/schedule
 * Agendar relatório
 */
router.post('/schedule', async (req, res) => {
  try {
    const { config, schedule, emailRecipients } = req.body;

    if (!config || !schedule || !emailRecipients) {
      return res.status(400).json({
        success: false,
        error: 'Config, schedule, and emailRecipients are required'
      });
    }

    await reportGenerationService.scheduleReport(config, schedule, emailRecipients);

    return res.json({
      success: true,
      message: 'Report scheduled successfully'
    });
  } catch (error) {
    console.error('Error scheduling report:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to schedule report'
    });
  }
});

/**
 * GET /api/admin/reports/scheduled
 * Listar relatórios agendados
 */
router.get('/scheduled', async (req, res) => {
  try {
    const scheduledReports = await reportGenerationService.getScheduledReports();

    return res.json({
      success: true,
      data: scheduledReports
    });
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduled reports'
    });
  }
});

/**
 * DELETE /api/admin/reports/scheduled/:id
 * Cancelar relatório agendado
 */
router.delete('/scheduled/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await reportGenerationService.cancelScheduledReport(id);

    return res.json({
      success: true,
      message: 'Scheduled report cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling scheduled report:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel scheduled report'
    });
  }
});

/**
 * GET /api/admin/reports/history
 * Histórico de relatórios
 */
router.get('/history', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const reportHistory = await reportGenerationService.getReportHistory(Number(limit));

    return res.json({
      success: true,
      data: reportHistory
    });
  } catch (error) {
    console.error('Error fetching report history:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch report history'
    });
  }
});

/**
 * GET /api/admin/reports/templates
 * Templates de relatórios disponíveis
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'revenue-summary',
        name: 'Revenue Summary',
        description: 'Monthly revenue metrics and trends',
        type: 'revenue',
        defaultMetrics: ['mrr', 'arr', 'churnRate', 'ltv']
      },
      {
        id: 'user-analytics',
        name: 'User Analytics',
        description: 'User engagement and activity metrics',
        type: 'users',
        defaultMetrics: ['engagement', 'activity', 'features']
      },
      {
        id: 'tenant-health',
        name: 'Tenant Health',
        description: 'Customer health scores and risk analysis',
        type: 'health',
        defaultMetrics: ['healthScore', 'riskLevel', 'trends']
      },
      {
        id: 'platform-overview',
        name: 'Platform Overview',
        description: 'Complete platform metrics and KPIs',
        type: 'custom',
        defaultMetrics: ['revenue', 'users', 'tenants', 'health']
      },
      {
        id: 'executive-summary',
        name: 'Executive Summary',
        description: 'High-level KPIs for executives',
        type: 'custom',
        defaultMetrics: ['mrr', 'growth', 'churn', 'ltv']
      }
    ];

    return res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching report templates:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch report templates'
    });
  }
});

/**
 * GET /api/admin/reports/metrics
 * Lista de métricas disponíveis
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      revenue: [
        { id: 'mrr', name: 'Monthly Recurring Revenue', description: 'Total monthly recurring revenue' },
        { id: 'arr', name: 'Annual Recurring Revenue', description: 'Total annual recurring revenue' },
        { id: 'churnRate', name: 'Churn Rate', description: 'Percentage of customers lost per month' },
        { id: 'ltv', name: 'Lifetime Value', description: 'Average customer lifetime value' },
        { id: 'cac', name: 'Customer Acquisition Cost', description: 'Cost to acquire new customers' },
        { id: 'ltvCacRatio', name: 'LTV/CAC Ratio', description: 'Lifetime value to acquisition cost ratio' }
      ],
      users: [
        { id: 'totalUsers', name: 'Total Users', description: 'Total number of users' },
        { id: 'activeUsers', name: 'Active Users', description: 'Users active in last 7 days' },
        { id: 'engagementScore', name: 'Engagement Score', description: 'Average user engagement score' },
        { id: 'featureUsage', name: 'Feature Usage', description: 'Feature adoption and usage statistics' }
      ],
      tenants: [
        { id: 'totalTenants', name: 'Total Tenants', description: 'Total number of tenants' },
        { id: 'activeTenants', name: 'Active Tenants', description: 'Tenants with active subscriptions' },
        { id: 'trialTenants', name: 'Trial Tenants', description: 'Tenants in trial period' },
        { id: 'churnedTenants', name: 'Churned Tenants', description: 'Tenants that have churned' }
      ],
      health: [
        { id: 'avgHealthScore', name: 'Average Health Score', description: 'Average customer health score' },
        { id: 'healthyTenants', name: 'Healthy Tenants', description: 'Number of healthy tenants' },
        { id: 'atRiskTenants', name: 'At-Risk Tenants', description: 'Number of tenants at risk' },
        { id: 'criticalTenants', name: 'Critical Tenants', description: 'Number of critical tenants' }
      ]
    };

    return res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching available metrics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch available metrics'
    });
  }
});

export default router;
