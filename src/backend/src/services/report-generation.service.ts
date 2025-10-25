import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { revenueAnalyticsService } from './revenue-analytics.service';
import { customerHealthService } from './customer-health.service';
import { userEngagementService } from './user-engagement.service';

const prisma = new PrismaClient();

export interface ReportConfig {
  type: 'revenue' | 'users' | 'tenants' | 'health' | 'custom';
  dateRange: {
    start: Date;
    end: Date;
  };
  filters?: {
    tenantIds?: string[];
    userRoles?: string[];
    plans?: string[];
  };
  format: 'pdf' | 'excel' | 'csv';
  includeCharts?: boolean;
  metrics?: string[];
}

export interface ReportData {
  title: string;
  generatedAt: Date;
  dateRange: string;
  summary: any;
  data: any[];
  charts?: any[];
  metadata: any;
}

export class ReportGenerationService {
  /**
   * Gera relatório baseado na configuração
   */
  async generateReport(config: ReportConfig): Promise<ReportData> {
    try {
      let reportData: ReportData;

      switch (config.type) {
        case 'revenue':
          reportData = await this.generateRevenueReport(config);
          break;
        case 'users':
          reportData = await this.generateUsersReport(config);
          break;
        case 'tenants':
          reportData = await this.generateTenantsReport(config);
          break;
        case 'health':
          reportData = await this.generateHealthReport(config);
          break;
        case 'custom':
          reportData = await this.generateCustomReport(config);
          break;
        default:
          throw new Error(`Unknown report type: ${config.type}`);
      }

      return reportData;
    } catch (error) {
      logger.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Gera relatório de receita
   */
  private async generateRevenueReport(config: ReportConfig): Promise<ReportData> {
    const metrics = await revenueAnalyticsService.getCurrentRevenueMetrics();
    const trends = await revenueAnalyticsService.getRevenueTrends(12);
    const revenueByPlan = await revenueAnalyticsService.getRevenueByPlan();
    const cohortAnalysis = await revenueAnalyticsService.getCohortAnalysis();
    const forecast = await revenueAnalyticsService.getRevenueForecast(6);

    const summary = {
      mrr: metrics.mrr,
      arr: metrics.arr,
      churnRate: metrics.churnRate,
      ltv: metrics.ltv,
      cac: metrics.cac,
      ltvCacRatio: metrics.ltvCacRatio,
      netRevenue: metrics.netRevenue
    };

    const charts = config.includeCharts ? [
      {
        type: 'line',
        title: 'MRR Trend',
        data: trends.map(t => ({ date: t.date, value: t.mrr }))
      },
      {
        type: 'bar',
        title: 'Revenue by Plan',
        data: revenueByPlan.map(p => ({ plan: p.plan, mrr: p.mrr }))
      },
      {
        type: 'pie',
        title: 'Revenue Distribution',
        data: revenueByPlan.map(p => ({ name: p.plan, value: p.mrr }))
      }
    ] : undefined;

    return {
      title: 'Revenue Analytics Report',
      generatedAt: new Date(),
      dateRange: `${config.dateRange.start.toISOString().split('T')[0]} to ${config.dateRange.end.toISOString().split('T')[0]}`,
      summary,
      data: trends,
      charts,
      metadata: {
        type: 'revenue',
        format: config.format,
        filters: config.filters
      }
    };
  }

  /**
   * Gera relatório de usuários
   */
  private async generateUsersReport(config: ReportConfig): Promise<ReportData> {
    const engagementData = await userEngagementService.calculateAllUserEngagement();
    const metrics = await userEngagementService.getEngagementMetrics();
    const featureStats = await userEngagementService.getFeatureUsageStats();
    const inactiveUsers = await userEngagementService.getInactiveUsers(30);
    const powerUsers = await userEngagementService.getPowerUsers();

    // Aplicar filtros
    let filteredData = engagementData;
    if (config.filters?.userRoles) {
      filteredData = filteredData.filter(u => config.filters!.userRoles!.includes(u.role));
    }
    if (config.filters?.tenantIds) {
      filteredData = filteredData.filter(u => config.filters!.tenantIds!.includes(u.tenantId));
    }

    const summary = {
      totalUsers: metrics.totalUsers,
      activeUsers: metrics.activeUsers,
      inactiveUsers: metrics.inactiveUsers,
      avgEngagementScore: metrics.avgEngagementScore,
      highEngagementUsers: metrics.highEngagementUsers,
      lowEngagementUsers: metrics.lowEngagementUsers,
      churnRiskUsers: metrics.churnRiskUsers
    };

    const charts = config.includeCharts ? [
      {
        type: 'bar',
        title: 'User Engagement Distribution',
        data: [
          { category: 'Very High', count: filteredData.filter(u => u.activityLevel === 'very_high').length },
          { category: 'High', count: filteredData.filter(u => u.activityLevel === 'high').length },
          { category: 'Medium', count: filteredData.filter(u => u.activityLevel === 'medium').length },
          { category: 'Low', count: filteredData.filter(u => u.activityLevel === 'low').length }
        ]
      },
      {
        type: 'bar',
        title: 'Top Features by Usage',
        data: featureStats.slice(0, 10).map(f => ({ feature: f.featureName, usage: f.totalUsage }))
      }
    ] : undefined;

    return {
      title: 'User Analytics Report',
      generatedAt: new Date(),
      dateRange: `${config.dateRange.start.toISOString().split('T')[0]} to ${config.dateRange.end.toISOString().split('T')[0]}`,
      summary,
      data: filteredData,
      charts,
      metadata: {
        type: 'users',
        format: config.format,
        filters: config.filters,
        inactiveUsersCount: inactiveUsers.length,
        powerUsersCount: powerUsers.length
      }
    };
  }

  /**
   * Gera relatório de tenants
   */
  private async generateTenantsReport(config: ReportConfig): Promise<ReportData> {
    const tenants = await prisma.tenant.findMany({
      include: {
        users: true,
        subscriptions: true,
        _count: {
          select: {
            users: true,
            subscriptions: true
          }
        }
      }
    });

    // Aplicar filtros
    let filteredTenants = tenants;
    if (config.filters?.plans) {
      filteredTenants = filteredTenants.filter(t => config.filters!.plans!.includes(t.plan));
    }
    if (config.filters?.tenantIds) {
      filteredTenants = filteredTenants.filter(t => config.filters!.tenantIds!.includes(t.id));
    }

    const summary = {
      totalTenants: filteredTenants.length,
      activeTenants: filteredTenants.filter(t => t.status === 'active').length,
      trialTenants: filteredTenants.filter(t => t.status === 'trial').length,
      inactiveTenants: filteredTenants.filter(t => t.status === 'inactive').length,
      totalUsers: filteredTenants.reduce((sum, t) => sum + t._count.users, 0),
      avgUsersPerTenant: filteredTenants.length > 0 
        ? filteredTenants.reduce((sum, t) => sum + t._count.users, 0) / filteredTenants.length 
        : 0
    };

    const charts = config.includeCharts ? [
      {
        type: 'pie',
        title: 'Tenants by Status',
        data: [
          { status: 'Active', count: summary.activeTenants },
          { status: 'Trial', count: summary.trialTenants },
          { status: 'Inactive', count: summary.inactiveTenants }
        ]
      },
      {
        type: 'bar',
        title: 'Tenants by Plan',
        data: filteredTenants.reduce((acc, t) => {
          const existing = acc.find(item => item.plan === t.plan);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ plan: t.plan, count: 1 });
          }
          return acc;
        }, [] as { plan: string; count: number }[])
      }
    ] : undefined;

    return {
      title: 'Tenants Analytics Report',
      generatedAt: new Date(),
      dateRange: `${config.dateRange.start.toISOString().split('T')[0]} to ${config.dateRange.end.toISOString().split('T')[0]}`,
      summary,
      data: filteredTenants,
      charts,
      metadata: {
        type: 'tenants',
        format: config.format,
        filters: config.filters
      }
    };
  }

  /**
   * Gera relatório de health
   */
  private async generateHealthReport(config: ReportConfig): Promise<ReportData> {
    const healthData = await customerHealthService.calculateAllCustomerHealth();
    const metrics = await customerHealthService.getHealthMetrics();
    const trends = await customerHealthService.getHealthTrends(6);
    const atRiskTenants = await customerHealthService.getAtRiskTenants();
    const improvingTenants = await customerHealthService.getImprovingTenants();

    // Aplicar filtros
    let filteredData = healthData;
    if (config.filters?.tenantIds) {
      filteredData = filteredData.filter(h => config.filters!.tenantIds!.includes(h.tenantId));
    }

    const summary = {
      totalTenants: metrics.totalTenants,
      healthyTenants: metrics.healthyTenants,
      atRiskTenants: metrics.atRiskTenants,
      criticalTenants: metrics.criticalTenants,
      avgHealthScore: metrics.avgHealthScore,
      healthScoreDistribution: metrics.healthScoreDistribution
    };

    const charts = config.includeCharts ? [
      {
        type: 'bar',
        title: 'Health Score Distribution',
        data: [
          { category: 'Excellent (80-100)', count: summary.healthScoreDistribution.excellent },
          { category: 'Good (60-79)', count: summary.healthScoreDistribution.good },
          { category: 'Fair (40-59)', count: summary.healthScoreDistribution.fair },
          { category: 'Poor (20-39)', count: summary.healthScoreDistribution.poor },
          { category: 'Critical (0-19)', count: summary.healthScoreDistribution.critical }
        ]
      },
      {
        type: 'line',
        title: 'Average Health Score Trend',
        data: trends.map(t => ({ date: t.date, score: t.avgHealthScore }))
      }
    ] : undefined;

    return {
      title: 'Customer Health Report',
      generatedAt: new Date(),
      dateRange: `${config.dateRange.start.toISOString().split('T')[0]} to ${config.dateRange.end.toISOString().split('T')[0]}`,
      summary,
      data: filteredData,
      charts,
      metadata: {
        type: 'health',
        format: config.format,
        filters: config.filters,
        atRiskCount: atRiskTenants.length,
        improvingCount: improvingTenants.length
      }
    };
  }

  /**
   * Gera relatório customizado
   */
  private async generateCustomReport(config: ReportConfig): Promise<ReportData> {
    // Implementar lógica para relatórios customizados baseados nas métricas solicitadas
    const data: any[] = [];
    const summary: any = {};
    const charts: any[] = [];

    // Buscar dados baseados nas métricas solicitadas
    if (config.metrics?.includes('revenue')) {
      const revenueMetrics = await revenueAnalyticsService.getCurrentRevenueMetrics();
      summary.revenue = revenueMetrics;
    }

    if (config.metrics?.includes('users')) {
      const userMetrics = await userEngagementService.getEngagementMetrics();
      summary.users = userMetrics;
    }

    if (config.metrics?.includes('health')) {
      const healthMetrics = await customerHealthService.getHealthMetrics();
      summary.health = healthMetrics;
    }

    return {
      title: 'Custom Analytics Report',
      generatedAt: new Date(),
      dateRange: `${config.dateRange.start.toISOString().split('T')[0]} to ${config.dateRange.end.toISOString().split('T')[0]}`,
      summary,
      data,
      charts,
      metadata: {
        type: 'custom',
        format: config.format,
        filters: config.filters,
        metrics: config.metrics
      }
    };
  }

  /**
   * Exporta relatório para PDF
   */
  async exportToPDF(reportData: ReportData): Promise<Buffer> {
    try {
      // Implementar geração de PDF usando uma biblioteca como puppeteer ou jsPDF
      // Por enquanto, retornar um buffer vazio
      logger.info('PDF export not implemented yet');
      return Buffer.from('PDF export not implemented');
    } catch (error) {
      logger.error('Error exporting to PDF:', error);
      throw error;
    }
  }

  /**
   * Exporta relatório para Excel
   */
  async exportToExcel(reportData: ReportData): Promise<Buffer> {
    try {
      // Implementar geração de Excel usando uma biblioteca como exceljs
      // Por enquanto, retornar um buffer vazio
      logger.info('Excel export not implemented yet');
      return Buffer.from('Excel export not implemented');
    } catch (error) {
      logger.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  /**
   * Exporta relatório para CSV
   */
  async exportToCSV(reportData: ReportData): Promise<string> {
    try {
      if (!reportData.data || reportData.data.length === 0) {
        return 'No data to export';
      }

      // Converter dados para CSV
      const headers = Object.keys(reportData.data[0]);
      const csvRows = [headers.join(',')];

      for (const row of reportData.data) {
        const values = headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value).replace(/,/g, ';'); // Substituir vírgulas para evitar conflitos
        });
        csvRows.push(values.join(','));
      }

      return csvRows.join('\n');
    } catch (error) {
      logger.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  /**
   * Agenda relatório para geração automática
   */
  async scheduleReport(
    config: ReportConfig, 
    schedule: 'daily' | 'weekly' | 'monthly',
    emailRecipients: string[]
  ): Promise<void> {
    try {
      // Implementar agendamento de relatórios
      // Por enquanto, apenas log
      logger.info(`Scheduling ${schedule} report for recipients: ${emailRecipients.join(', ')}`);
    } catch (error) {
      logger.error('Error scheduling report:', error);
      throw error;
    }
  }

  /**
   * Lista relatórios agendados
   */
  async getScheduledReports(): Promise<any[]> {
    try {
      // Implementar busca de relatórios agendados
      // Por enquanto, retornar array vazio
      return [];
    } catch (error) {
      logger.error('Error getting scheduled reports:', error);
      throw error;
    }
  }

  /**
   * Cancela relatório agendado
   */
  async cancelScheduledReport(reportId: string): Promise<void> {
    try {
      // Implementar cancelamento de relatório agendado
      logger.info(`Cancelling scheduled report: ${reportId}`);
    } catch (error) {
      logger.error('Error cancelling scheduled report:', error);
      throw error;
    }
  }

  /**
   * Obtém histórico de relatórios gerados
   */
  async getReportHistory(limit: number = 50): Promise<any[]> {
    try {
      // Implementar busca de histórico de relatórios
      // Por enquanto, retornar array vazio
      return [];
    } catch (error) {
      logger.error('Error getting report history:', error);
      throw error;
    }
  }
}


